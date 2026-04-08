"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import {
  approveBankAccount,
  getBankAccountById,
  getBankAccountFile,
  getBankAccountsAll,
  normalizeBankAccountsAllPage,
  rejectBankAccount,
} from "@/lib/apiClient";
import type { BankAccount, BankAccountsAllQuery } from "@/types/bankAccount";
import { AxiosError } from "axios";
import {
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type DetailState = (BankAccount & {
  photo_rekening_url: string;
  photo_ktp_url: string;
  user: {
    id: number;
    name: string;
    email: string;
    whatsapp: string | null;
    email_verified_at: string | null;
    balance: string;
    created_at: string;
    updated_at: string;
  };
}) | null;

function clampPerPage(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 20;
  return Math.min(100, Math.floor(n));
}

function buildBankAccountsAllQuery(
  pageNum: number,
  opts: { search: string; status: string; userId: string; perPage: number }
): BankAccountsAllQuery {
  const q: BankAccountsAllQuery = {
    page: pageNum,
    per_page: clampPerPage(opts.perPage),
  };
  const t = opts.search.trim();
  if (t) q.search = t;
  if (opts.status !== "all") {
    q.status = opts.status as "pending" | "approved" | "rejected";
  }
  const uid = parseInt(opts.userId.trim(), 10);
  if (Number.isFinite(uid) && uid > 0) q.user_id = uid;
  return q;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return (
        <Badge className="border-green-200 bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Disetujui
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="border-red-200 bg-red-100 text-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Ditolak
        </Badge>
      );
    default:
      return (
        <Badge className="border-amber-200 bg-amber-100 text-amber-900">
          <Clock className="mr-1 h-3 w-3" />
          Menunggu
        </Badge>
      );
  }
}

function ListBankAccountsInner() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  /** Hindari dependency object `searchParams` yang bisa memicu loop */
  const urlStatusParam = searchParams.get("status") ?? "";
  const canVerify = hasPermission("bank-accounts.update");

  const [searchDraft, setSearchDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<string>("all");
  const [userIdDraft, setUserIdDraft] = useState("");
  const [perPageDraft, setPerPageDraft] = useState("20");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [userId, setUserId] = useState("");
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<BankAccount[]>([]);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<DetailState>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [imageErrors, setImageErrors] = useState({
    rekening: false,
    ktp: false,
  });
  const [imageBlobUrls, setImageBlobUrls] = useState({
    rekening: null as string | null,
    ktp: null as string | null,
  });

  const loadImageAsBlob = async (accountId: number, type: "rekening" | "ktp") => {
    try {
      const blobUrl = await getBankAccountFile(accountId, type);
      setImageBlobUrls((prev) => ({ ...prev, [type]: blobUrl }));
      setImageErrors((prev) => ({ ...prev, [type]: false }));
    } catch {
      setImageErrors((prev) => ({ ...prev, [type]: true }));
    }
  };

  const fetchWithQuery = useCallback(async (q: BankAccountsAllQuery) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBankAccountsAll(q);
      const { rows: list, meta: m } = normalizeBankAccountsAllPage(res);
      setRows(list);
      if (m) {
        setMeta({
          current_page: m.current_page,
          last_page: m.last_page,
          per_page: m.per_page,
          total: m.total,
        });
        setPage(m.current_page);
      } else {
        setMeta(null);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = (err.response?.data as { message?: string })?.message;
        setError(msg || "Gagal memuat daftar rekening.");
      } else {
        setError("Gagal memuat daftar rekening.");
      }
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !hasPermission("bank-accounts.view_all")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  /** Muat awal + saat ?status= di URL berubah */
  useEffect(() => {
    if (authLoading || !hasPermission("bank-accounts.view_all")) return;
    const st =
      urlStatusParam === "pending" ||
        urlStatusParam === "approved" ||
        urlStatusParam === "rejected"
        ? urlStatusParam
        : "all";
    setStatusDraft(st);
    setStatus(st);
    setSearch("");
    setSearchDraft("");
    setUserId("");
    setUserIdDraft("");
    setPerPage(20);
    setPerPageDraft("20");
    const q = buildBankAccountsAllQuery(1, {
      search: "",
      status: st,
      userId: "",
      perPage: 20,
    });
    void fetchWithQuery(q);
  }, [authLoading, hasPermission, urlStatusParam, fetchWithQuery]);

  const applyFilters = () => {
    const pp = clampPerPage(parseInt(perPageDraft, 10) || 20);
    setSearch(searchDraft);
    setStatus(statusDraft);
    setUserId(userIdDraft);
    setPerPage(pp);
    setPerPageDraft(String(pp));
    setPage(1);
    void fetchWithQuery(
      buildBankAccountsAllQuery(1, {
        search: searchDraft,
        status: statusDraft,
        userId: userIdDraft,
        perPage: pp,
      })
    );
  };

  const goToPage = (p: number) => {
    void fetchWithQuery(
      buildBankAccountsAllQuery(p, {
        search,
        status,
        userId,
        perPage,
      })
    );
  };

  const refreshCurrentPage = () => {
    const p = meta?.current_page ?? page;
    void fetchWithQuery(
      buildBankAccountsAllQuery(p, {
        search,
        status,
        userId,
        perPage,
      })
    );
  };

  const openDetail = async (account: BankAccount) => {
    setSelected(account);
    setDetailLoading(true);
    setImageErrors({ rekening: false, ktp: false });
    setImageBlobUrls({ rekening: null, ktp: null });
    setDetailOpen(true);
    try {
      const res = await getBankAccountById(account.id);
      setDetail(res.data);
    } catch {
      toast.error("Gagal memuat detail rekening.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await approveBankAccount(selected.id);
      toast.success("Rekening berhasil disetujui.");
      setApproveOpen(false);
      setSelected(null);
      refreshCurrentPage();
    } catch {
      toast.error("Gagal menyetujui rekening.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!selected || !rejectReason.trim()) {
      toast.error("Alasan penolakan harus diisi.");
      return;
    }
    setActionLoading(true);
    try {
      await rejectBankAccount(selected.id, rejectReason.trim());
      toast.success("Rekening ditolak.");
      setRejectOpen(false);
      setRejectReason("");
      setSelected(null);
      refreshCurrentPage();
    } catch {
      toast.error("Gagal menolak rekening.");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex min-h-[40vh] items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Memuat…</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!hasPermission("bank-accounts.view_all")) {
    return null;
  }

  const currentPage = meta?.current_page ?? page;
  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total ?? rows.length;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <Building2 className="h-7 w-7 text-blue-600" />
                Daftar Rekening Bank
              </h1>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={loading}
              onClick={() => refreshCurrentPage()}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Muat ulang
            </Button>
          </div>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="filter-search">Pencarian</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="filter-search"
                      className="pl-9"
                      placeholder="Nama bank, nama rekening, nomor rekening"
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusDraft} onValueChange={setStatusDraft}>
                    <SelectTrigger className="w-full">
                      <Filter className="mr-2 h-4 w-4 shrink-0" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="approved">Disetujui</SelectItem>
                      <SelectItem value="rejected">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-user">ID pemilik (user_id)</Label>
                  <Input
                    id="filter-user"
                    inputMode="numeric"
                    placeholder="Opsional"
                    value={userIdDraft}
                    onChange={(e) =>
                      setUserIdDraft(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-per-page">Per halaman</Label>
                  <Select
                    value={perPageDraft}
                    onValueChange={setPerPageDraft}
                  >
                    <SelectTrigger id="filter-per-page" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                variant="blueGradientStrong"
                size="sm"
                onClick={applyFilters}
                disabled={loading}>
                Terapkan filter
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">
                {loading
                  ? "Memuat…"
                  : `Menampilkan ${rows.length} entri${meta ? ` · total ${total}` : ""}`}
              </CardTitle>
              {meta && lastPage > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    Halaman {currentPage} / {lastPage}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || currentPage >= lastPage}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Memuat data…
                </div>
              ) : error ? (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </div>
              ) : rows.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  Tidak ada rekening yang cocok dengan filter.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bank</TableHead>
                        <TableHead>Nama rekening</TableHead>
                        <TableHead>No. rekening</TableHead>
                        <TableHead>Pemilik</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">
                            {account.bank_name}
                          </TableCell>
                          <TableCell>{account.account_name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {account.account_number}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="truncate font-medium">
                                {account.user?.name ?? "—"}
                              </p>
                              <p className="text-muted-foreground truncate text-xs">
                                {account.user?.email ?? ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(account.status)}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {account.created_at
                              ? new Date(account.created_at).toLocaleString(
                                "id-ID"
                              )
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void openDetail(account)}
                              >
                                <Eye className="h-3 w-3" />
                                <span className="sr-only">Detail</span>
                              </Button>
                              {canVerify && account.status === "pending" && (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-green-700"
                                    onClick={() => {
                                      setSelected(account);
                                      setApproveOpen(true);
                                    }}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-red-700"
                                    onClick={() => {
                                      setSelected(account);
                                      setRejectOpen(true);
                                    }}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
            <DialogHeader className="shrink-0 border-b p-6 text-left">
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Detail rekening
              </DialogTitle>
              <DialogDescription>
                Informasi pemilik dan dokumen verifikasi.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : detail ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        Pemilik
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground">Nama</p>
                        <p className="font-medium">{detail.user.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p>{detail.user.email}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">Rekening</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground">Bank</p>
                        <p className="font-medium">{detail.bank_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <div className="mt-1">
                          {getStatusBadge(detail.status)}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Nama rekening</p>
                        <p>{detail.account_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Nomor</p>
                        <p className="font-mono">{detail.account_number}</p>
                      </div>
                      {detail.rejected_reason && (
                        <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
                          <p className="text-xs font-medium">Alasan penolakan</p>
                          <p className="mt-1">{detail.rejected_reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ImageIcon className="h-4 w-4" />
                        Dokumen
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                      {(["rekening", "ktp"] as const).map((type) => {
                        const urlField =
                          type === "rekening"
                            ? detail.photo_rekening_url
                            : detail.photo_ktp_url;
                        const label =
                          type === "rekening" ? "Foto rekening" : "Foto KTP";
                        const blob =
                          type === "rekening"
                            ? imageBlobUrls.rekening
                            : imageBlobUrls.ktp;
                        const err =
                          type === "rekening"
                            ? imageErrors.rekening
                            : imageErrors.ktp;
                        return (
                          <div key={type}>
                            <Label className="mb-2 flex items-center gap-1 text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {label}
                            </Label>
                            <div className="rounded-lg border bg-slate-50 p-3">
                              {urlField ? (
                                !err ? (
                                  // eslint-disable-next-line @next/next/no-img-element -- blob / signed URL dari API
                                  <img
                                    src={blob || urlField}
                                    alt={label}
                                    className="max-h-72 w-full rounded object-contain"
                                    onError={() => {
                                      if (!blob) {
                                        void loadImageAsBlob(detail.id, type);
                                      } else {
                                        setImageErrors((prev) => ({
                                          ...prev,
                                          [type]: true,
                                        }));
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="space-y-2 py-6 text-center text-sm text-muted-foreground">
                                    <p>Gagal memuat gambar.</p>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        window.open(urlField, "_blank")
                                      }
                                    >
                                      Buka di tab baru
                                    </Button>
                                  </div>
                                )
                              ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                  Tidak tersedia
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Setujui rekening?</DialogTitle>
              <DialogDescription>
                Rekening akan ditandai disetujui. Tindakan ini mengikuti
                kebijakan internal Anda.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApproveOpen(false)}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700"
                disabled={actionLoading}
                onClick={() => void confirmApprove()}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Setujui"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
            <DialogHeader className="shrink-0 text-left">
              <DialogTitle>Tolak rekening</DialogTitle>
              <DialogDescription>
                Berikan alasan penolakan yang jelas untuk pemilik rekening.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto py-2">
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan penolakan…"
                rows={5}
                className="resize-none"
              />
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason("");
                }}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={actionLoading}
                onClick={() => void confirmReject()}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Tolak"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ListBankAccountsPage() {
  return (
    <Suspense
      fallback={
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <div className="flex min-h-[40vh] items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span>Memuat…</span>
            </div>
          </SidebarInset>
        </SidebarProvider>
      }
    >
      <ListBankAccountsInner />
    </Suspense>
  );
}

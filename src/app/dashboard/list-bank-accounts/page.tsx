"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { BankLogo } from "@/components/redesign/bank-logo";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatCard } from "@/components/redesign/stat-card";
import { StatusBadge } from "@/components/redesign/status-badge";
import { Button } from "@/components/ui/button";
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
  approveBankAccountDeletion,
  getBankAccountById,
  getBankAccountFile,
  getBankAccountsAll,
  normalizeBankAccountsAllPage,
  rejectBankAccount,
  rejectBankAccountDeletion,
} from "@/lib/apiClient";
import { formatDateTimeId } from "@/lib/date";
import type { BankAccount, BankAccountsAllQuery } from "@/types/bankAccount";
import { AxiosError } from "axios";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type DetailState =
  | (BankAccount & {
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
    })
  | null;

/** Sumbu tampilan: "pengajuan verifikasi" dan "pengajuan hapus" independen satu sama lain (lihat docs/be-fe). */
type QuickFilter = "pending" | "pending_deletion" | "approved" | "all";

const headCls = "h-11 text-xs font-semibold text-slate-500";
const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";

function clampPerPage(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 20;
  return Math.min(100, Math.floor(n));
}

function buildQuery(
  pageNum: number,
  opts: {
    quickFilter: QuickFilter;
    search: string;
    status: string;
    userId: string;
    perPage: number;
  }
): BankAccountsAllQuery {
  const q: BankAccountsAllQuery = {
    page: pageNum,
    per_page: clampPerPage(opts.perPage),
  };
  const t = opts.search.trim();
  if (t) q.search = t;
  const uid = parseInt(opts.userId.trim(), 10);
  if (Number.isFinite(uid) && uid > 0) q.user_id = uid;

  if (opts.quickFilter === "pending") q.status = "pending";
  else if (opts.quickFilter === "pending_deletion") q.pending_deletion = 1;
  else if (opts.quickFilter === "approved") q.status = "approved";
  else if (opts.status !== "all") {
    q.status = opts.status as "pending" | "approved" | "rejected";
  }
  return q;
}

function ListBankAccountsInner() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStatusParam = searchParams.get("status") ?? "";
  const canApprove = hasPermission("bank-accounts.approve");
  const canReject = hasPermission("bank-accounts.reject");

  const [quickFilter, setQuickFilter] = useState<QuickFilter>("pending");
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

  const [counts, setCounts] = useState<{
    total: number;
    pending: number;
    pendingDeletion: number;
    approved: number;
  } | null>(null);
  const [countsLoading, setCountsLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<DetailState>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveDeletionOpen, setApproveDeletionOpen] = useState(false);
  const [rejectDeletionOpen, setRejectDeletionOpen] = useState(false);
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

  /** Jumlah untuk kartu ringkasan — independen dari filter/pencarian yang sedang aktif. */
  const loadCounts = useCallback(async () => {
    if (!hasPermission("bank-accounts.view_all")) return;
    setCountsLoading(true);
    try {
      const [totalRes, pendingRes, delRes, approvedRes] = await Promise.all([
        getBankAccountsAll({ per_page: 1 }),
        getBankAccountsAll({ status: "pending", per_page: 1 }),
        getBankAccountsAll({ pending_deletion: 1, per_page: 1 }),
        getBankAccountsAll({ status: "approved", per_page: 1 }),
      ]);
      const totalOf = (r: typeof totalRes) =>
        normalizeBankAccountsAllPage(r).meta?.total ??
        normalizeBankAccountsAllPage(r).rows.length;
      setCounts({
        total: totalOf(totalRes),
        pending: totalOf(pendingRes),
        pendingDeletion: totalOf(delRes),
        approved: totalOf(approvedRes),
      });
    } catch {
      setCounts(null);
    } finally {
      setCountsLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    if (!authLoading && !hasPermission("bank-accounts.view_all")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  /** Muat awal + saat ?status= di URL berubah */
  useEffect(() => {
    if (authLoading || !hasPermission("bank-accounts.view_all")) return;
    let qf: QuickFilter = "pending";
    let st = "all";
    if (urlStatusParam === "pending") qf = "pending";
    else if (urlStatusParam === "approved") qf = "approved";
    else if (urlStatusParam === "rejected") {
      qf = "all";
      st = "rejected";
    }
    setQuickFilter(qf);
    setStatusDraft(st);
    setStatus(st);
    setSearch("");
    setSearchDraft("");
    setUserId("");
    setUserIdDraft("");
    setPerPage(20);
    setPerPageDraft("20");
    void fetchWithQuery(
      buildQuery(1, { quickFilter: qf, search: "", status: st, userId: "", perPage: 20 })
    );
    void loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, hasPermission, urlStatusParam, fetchWithQuery]);

  const selectQuickFilter = (qf: QuickFilter) => {
    setQuickFilter(qf);
    setPage(1);
    void fetchWithQuery(
      buildQuery(1, { quickFilter: qf, search, status, userId, perPage })
    );
  };

  const applyFilters = () => {
    const pp = clampPerPage(parseInt(perPageDraft, 10) || 20);
    setSearch(searchDraft);
    setStatus(statusDraft);
    setUserId(userIdDraft);
    setPerPage(pp);
    setPerPageDraft(String(pp));
    setPage(1);
    void fetchWithQuery(
      buildQuery(1, {
        quickFilter,
        search: searchDraft,
        status: statusDraft,
        userId: userIdDraft,
        perPage: pp,
      })
    );
  };

  const resetFilters = () => {
    setSearchDraft("");
    setStatusDraft("all");
    setUserIdDraft("");
    setPerPageDraft("20");
    setSearch("");
    setStatus("all");
    setUserId("");
    setPerPage(20);
    setPage(1);
    void fetchWithQuery(
      buildQuery(1, { quickFilter, search: "", status: "all", userId: "", perPage: 20 })
    );
  };

  const goToPage = (p: number) => {
    void fetchWithQuery(
      buildQuery(p, { quickFilter, search, status, userId, perPage })
    );
  };

  const refreshAll = () => {
    const p = meta?.current_page ?? page;
    void fetchWithQuery(
      buildQuery(p, { quickFilter, search, status, userId, perPage })
    );
    void loadCounts();
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
      refreshAll();
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
      refreshAll();
    } catch {
      toast.error("Gagal menolak rekening.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmApproveDeletion = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await approveBankAccountDeletion(selected.id);
      toast.success("Rekening berhasil dihapus.");
      setApproveDeletionOpen(false);
      setSelected(null);
      refreshAll();
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string })?.message
          : undefined;
      toast.error(msg || "Gagal menghapus rekening.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmRejectDeletion = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await rejectBankAccountDeletion(selected.id);
      toast.success("Permintaan penghapusan ditolak.");
      setRejectDeletionOpen(false);
      setSelected(null);
      refreshAll();
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string })?.message
          : undefined;
      toast.error(msg || "Gagal menolak permintaan penghapusan.");
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
  const countValue = (n: number | undefined) =>
    n !== undefined ? String(n) : countsLoading ? "…" : "–";

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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Semua Rekening Bank" },
            ]}
            icon={Building2}
            title="Semua Rekening Bank"
            description="Kelola pengajuan rekening baru, edit, dan penghapusan dari seluruh pengguna."
            illustration="/images/credit-cards.png"
            illustrationClassName="w-[120px]"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 gap-2 rounded-lg border-slate-200 bg-white"
                disabled={loading}
                onClick={refreshAll}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Muat Ulang
              </Button>
            }
          />

          {/* Kartu ringkasan — klik untuk menyaring daftar di bawah */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              tone="blue"
              title="Total Rekening"
              value={countValue(counts?.total)}
              hint="Semua rekening terdaftar"
              active={quickFilter === "all"}
              onClick={() => selectQuickFilter("all")}
            />
            <StatCard
              icon={Clock}
              tone="orange"
              title="Menunggu Verifikasi"
              value={countValue(counts?.pending)}
              hint="Pengajuan baru / edit"
              active={quickFilter === "pending"}
              onClick={() => selectQuickFilter("pending")}
            />
            <StatCard
              icon={Trash2}
              tone="red"
              title="Menunggu Persetujuan Hapus"
              value={countValue(counts?.pendingDeletion)}
              hint="Permintaan hapus rekening"
              active={quickFilter === "pending_deletion"}
              onClick={() => selectQuickFilter("pending_deletion")}
            />
            <StatCard
              icon={CheckCircle2}
              tone="green"
              title="Disetujui"
              value={countValue(counts?.approved)}
              hint="Siap dipakai pencairan"
              active={quickFilter === "approved"}
              onClick={() => selectQuickFilter("approved")}
            />
          </div>

          <SectionCard icon={SlidersHorizontal} title="Filter">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="filter-search" className="text-sm font-medium text-slate-700">
                    Pencarian
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="filter-search"
                      className={`${fieldCls} pl-9`}
                      placeholder="Nama bank, nama rekening, nomor rekening"
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                    />
                  </div>
                </div>
                {quickFilter === "all" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Status</Label>
                    <Select value={statusDraft} onValueChange={setStatusDraft}>
                      <SelectTrigger className={fieldCls}>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="pending">Menunggu</SelectItem>
                        <SelectItem value="approved">Disetujui</SelectItem>
                        <SelectItem value="rejected">Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="filter-user" className="text-sm font-medium text-slate-700">
                    ID pemilik (user_id)
                  </Label>
                  <Input
                    id="filter-user"
                    inputMode="numeric"
                    placeholder="Opsional"
                    className={fieldCls}
                    value={userIdDraft}
                    onChange={(e) =>
                      setUserIdDraft(e.target.value.replace(/\D/g, ""))
                    }
                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-per-page" className="text-sm font-medium text-slate-700">
                    Per halaman
                  </Label>
                  <Select value={perPageDraft} onValueChange={setPerPageDraft}>
                    <SelectTrigger id="filter-per-page" className={fieldCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 30, 40, 50].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  onClick={applyFilters}
                  disabled={loading}
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Terapkan Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={resetFilters}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </Button>
              </div>
            </div>
          </SectionCard>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {quickFilter === "pending"
                  ? "Menunggu Verifikasi"
                  : quickFilter === "pending_deletion"
                    ? "Menunggu Persetujuan Hapus"
                    : quickFilter === "approved"
                      ? "Rekening Disetujui"
                      : "Semua Rekening"}
              </h2>
              {!loading && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  {total} entri
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                Memuat data…
              </div>
            ) : error ? (
              <div
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                role="alert"
              >
                {error}
              </div>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Tidak ada rekening yang cocok dengan filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className={headCls}>Bank</TableHead>
                      <TableHead className={headCls}>Nama Rekening</TableHead>
                      <TableHead className={headCls}>No. Rekening</TableHead>
                      <TableHead className={headCls}>Pemilik</TableHead>
                      <TableHead className={headCls}>Status</TableHead>
                      <TableHead className={headCls}>Tanggal</TableHead>
                      <TableHead className={`${headCls} text-right`}>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((account) => {
                      const isDeletion = Boolean(account.deletion_requested_at);
                      return (
                        <TableRow
                          key={account.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <BankLogo bankName={account.bank_name} />
                              <span className="text-sm font-semibold text-slate-900">
                                {account.bank_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700">
                            {account.account_name}
                          </TableCell>
                          <TableCell className="py-4 font-mono text-sm text-slate-700">
                            {account.account_number}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="max-w-[200px]">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {account.user?.name ?? "—"}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {account.user?.email ?? ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col items-start gap-1.5">
                              {account.status === "approved" ? (
                                <StatusBadge status="success" label="Disetujui" />
                              ) : account.status === "rejected" ? (
                                <StatusBadge status="failed" label="Ditolak" />
                              ) : (
                                <StatusBadge status="pending" label="Menunggu" />
                              )}
                              {isDeletion && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                                  <Trash2 className="h-3 w-3" aria-hidden />
                                  Pengajuan Hapus
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm text-slate-600">
                            {(() => {
                              const dt = formatDateTimeId(account.created_at);
                              return dt ? `${dt.date}, ${dt.time.slice(0, 5)}` : "—";
                            })()}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5 rounded-lg border-slate-200"
                                onClick={() => void openDetail(account)}
                              >
                                <Eye className="h-3.5 w-3.5" aria-hidden />
                                Detail
                              </Button>
                              {isDeletion ? (
                                <>
                                  {canApprove && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-9 gap-1.5 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
                                      onClick={() => {
                                        setSelected(account);
                                        setApproveDeletionOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                      Setujui Hapus
                                    </Button>
                                  )}
                                  {canReject && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-9 gap-1.5 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => {
                                        setSelected(account);
                                        setRejectDeletionOpen(true);
                                      }}
                                    >
                                      <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                                      Tolak Hapus
                                    </Button>
                                  )}
                                </>
                              ) : (
                                account.status === "pending" && (
                                  <>
                                    {canApprove && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-9 gap-1.5 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => {
                                          setSelected(account);
                                          setApproveOpen(true);
                                        }}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                        Setujui
                                      </Button>
                                    )}
                                    {canReject && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-9 gap-1.5 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
                                        onClick={() => {
                                          setSelected(account);
                                          setRejectOpen(true);
                                        }}
                                      >
                                        <XCircle className="h-3.5 w-3.5" aria-hidden />
                                        Tolak
                                      </Button>
                                    )}
                                  </>
                                )
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <NumberedPagination
                  className="mt-2"
                  page={currentPage}
                  lastPage={lastPage}
                  total={total}
                  perPage={perPage}
                  disabled={loading}
                  onPageChange={goToPage}
                  onPerPageChange={(n) => {
                    setPerPage(n);
                    setPage(1);
                    void fetchWithQuery(
                      buildQuery(1, { quickFilter, search, status, userId, perPage: n })
                    );
                  }}
                />
              </div>
            )}
          </section>
        </div>

        {/* Detail */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl">
            <DialogHeader className="shrink-0 border-b border-slate-100 p-6 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Building2 className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <DialogTitle>Detail Rekening</DialogTitle>
                  <DialogDescription>
                    Informasi pemilik dan dokumen verifikasi.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : detail ? (
                <div className="space-y-5">
                  {detail.deletion_requested_at && (
                    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-rose-900">
                          Menunggu Persetujuan Hapus
                        </p>
                        <p className="mt-0.5 text-sm text-rose-800">
                          Diajukan {formatDateTimeId(detail.deletion_requested_at)?.date}
                          {" "}
                          {formatDateTimeId(detail.deletion_requested_at)?.time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-100 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <User className="h-4 w-4 text-slate-400" aria-hidden />
                      Pemilik
                    </h3>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500">Nama</p>
                        <p className="font-medium text-slate-900">{detail.user.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-slate-800">{detail.user.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Rekening</h3>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-3 sm:col-span-2">
                        <BankLogo bankName={detail.bank_name} className="h-10 w-10" />
                        <div>
                          <p className="text-xs text-slate-500">Bank</p>
                          <p className="font-medium text-slate-900">{detail.bank_name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <div className="mt-1">
                          {detail.status === "approved" ? (
                            <StatusBadge status="success" label="Disetujui" />
                          ) : detail.status === "rejected" ? (
                            <StatusBadge status="failed" label="Ditolak" />
                          ) : (
                            <StatusBadge status="pending" label="Menunggu" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Nama rekening</p>
                        <p className="text-slate-800">{detail.account_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Nomor</p>
                        <p className="font-mono text-slate-800">{detail.account_number}</p>
                      </div>
                      {detail.rejected_reason && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 sm:col-span-2">
                          <p className="text-xs font-medium">Alasan penolakan</p>
                          <p className="mt-1 text-sm">{detail.rejected_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <ImageIcon className="h-4 w-4 text-slate-400" aria-hidden />
                      Dokumen
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
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
                            <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
                              <FileText className="h-3.5 w-3.5" aria-hidden />
                              {label}
                            </p>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              {urlField ? (
                                !err ? (
                                  // eslint-disable-next-line @next/next/no-img-element -- blob / signed URL dari API
                                  <img
                                    src={blob || urlField}
                                    alt={label}
                                    className="max-h-72 w-full rounded-lg object-contain"
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
                                  <div className="space-y-2 py-6 text-center text-sm text-slate-500">
                                    <p>Gagal memuat gambar.</p>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="rounded-lg"
                                      onClick={() => window.open(urlField, "_blank")}
                                    >
                                      Buka di tab baru
                                    </Button>
                                  </div>
                                )
                              ) : (
                                <p className="py-6 text-center text-sm text-slate-500">
                                  Tidak tersedia
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        {/* Setujui verifikasi */}
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader className="items-center text-center sm:text-center">
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" aria-hidden />
              </span>
              <DialogTitle>Setujui rekening?</DialogTitle>
              <DialogDescription>
                Rekening akan ditandai disetujui dan bisa dipakai untuk
                pencairan saldo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
                onClick={() => setApproveOpen(false)}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="h-10 gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                disabled={actionLoading}
                onClick={() => void confirmApprove()}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Setujui
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tolak verifikasi */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl border-slate-100 p-0 sm:max-w-md">
            <DialogHeader className="shrink-0 p-6 pb-2 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <XCircle className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <DialogTitle>Tolak rekening</DialogTitle>
                  <DialogDescription>
                    Berikan alasan penolakan yang jelas untuk pemilik rekening.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan penolakan…"
                rows={5}
                className="resize-none rounded-lg border-slate-200"
              />
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 p-6">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
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
                className="h-10 gap-2 rounded-lg"
                disabled={actionLoading}
                onClick={() => void confirmReject()}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Tolak
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Setujui penghapusan (permanen) */}
        <Dialog open={approveDeletionOpen} onOpenChange={setApproveDeletionOpen}>
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader className="items-center text-center sm:text-center">
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-7 w-7" aria-hidden />
              </span>
              <DialogTitle>Setujui penghapusan rekening?</DialogTitle>
              <DialogDescription>
                Rekening <strong>{selected?.bank_name}</strong> ·{" "}
                {selected?.account_number} akan{" "}
                <strong>benar-benar dihapus</strong> dan tindakan ini{" "}
                <strong>tidak bisa dibatalkan</strong>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
                onClick={() => setApproveDeletionOpen(false)}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-10 gap-2 rounded-lg"
                disabled={actionLoading}
                onClick={() => void confirmApproveDeletion()}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Ya, Hapus Rekening
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tolak penghapusan */}
        <Dialog open={rejectDeletionOpen} onOpenChange={setRejectDeletionOpen}>
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader className="items-center text-center sm:text-center">
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldAlert className="h-7 w-7" aria-hidden />
              </span>
              <DialogTitle>Tolak permintaan penghapusan?</DialogTitle>
              <DialogDescription>
                Rekening akan kembali normal seperti sebelumnya; status dan
                data rekening tidak berubah.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
                onClick={() => setRejectDeletionOpen(false)}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="h-10 gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                disabled={actionLoading}
                onClick={() => void confirmRejectDeletion()}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Tolak Penghapusan
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

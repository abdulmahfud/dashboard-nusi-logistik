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
import { useAuth } from "@/context/AuthContext";
import { formatDateIdLong } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import {
  generateKerjaSamaInvoice,
  getKerjaSamaAccounts,
  getKerjaSamaInvoices,
} from "@/lib/apiClient";
import {
  KERJA_SAMA_INVOICE_STATUS_LABEL,
  type KerjaSamaAccount,
  type KerjaSamaInvoice,
} from "@/types/kerjaSama";
import { AxiosError } from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { message?: string })?.message || fallback;
  }
  return fallback;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "border-green-200 bg-green-100 text-green-800";
    case "partially_paid":
      return "border-amber-200 bg-amber-100 text-amber-900";
    case "overdue":
      return "border-red-200 bg-red-100 text-red-800";
    case "issued":
      return "border-blue-200 bg-blue-100 text-blue-800";
    case "void":
      return "border-gray-200 bg-gray-100 text-gray-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export default function KerjaSamaInvoicesPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<KerjaSamaInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Generate dialog
  const [genOpen, setGenOpen] = useState(false);
  const [genSaving, setGenSaving] = useState(false);
  const [accountQuery, setAccountQuery] = useState("");
  const [accountResults, setAccountResults] = useState<KerjaSamaAccount[]>([]);
  const [searchingAccount, setSearchingAccount] = useState(false);
  const [showAccountResults, setShowAccountResults] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<KerjaSamaAccount | null>(null);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const accountInputRef = useRef<HTMLDivElement>(null);

  const canGenerate = hasPermission("kerja-sama.invoices.generate");

  const fetchList = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getKerjaSamaInvoices({
          page: targetPage,
          status: statusFilter === "all" ? undefined : statusFilter,
        });
        setRows(res.data.data);
        setPage(res.data.current_page);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat daftar invoice."));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    if (!authLoading && !hasPermission("kerja-sama.invoices.view")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!authLoading && hasPermission("kerja-sama.invoices.view")) {
      void fetchList(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, hasPermission, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountInputRef.current &&
        !accountInputRef.current.contains(event.target as Node)
      ) {
        setShowAccountResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (accountQuery.trim().length < 2 || selectedAccount) {
      setAccountResults([]);
      return;
    }
    setSearchingAccount(true);
    const t = setTimeout(() => {
      getKerjaSamaAccounts({ search: accountQuery, per_page: 10 })
        .then((res) => {
          setAccountResults(res.data.data);
          setShowAccountResults(true);
        })
        .catch(() => setAccountResults([]))
        .finally(() => setSearchingAccount(false));
    }, 300);
    return () => clearTimeout(t);
  }, [accountQuery, selectedAccount]);

  const resetGenerateForm = () => {
    setAccountQuery("");
    setSelectedAccount(null);
    setAccountResults([]);
    setPeriodStart("");
    setPeriodEnd("");
  };

  const submitGenerate = async () => {
    if (!selectedAccount) {
      toast.error("Pilih akun kerja sama terlebih dahulu.");
      return;
    }
    setGenSaving(true);
    try {
      const res = await generateKerjaSamaInvoice({
        user_id: selectedAccount.id,
        period_start: periodStart || undefined,
        period_end: periodEnd || undefined,
      });
      toast.success(res.message || "Invoice berhasil dibuat.");
      setGenOpen(false);
      resetGenerateForm();
      router.push(`/dashboard/kerja-sama/invoices/${res.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal generate invoice."));
    } finally {
      setGenSaving(false);
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

  if (!hasPermission("kerja-sama.invoices.view")) return null;

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
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                <ReceiptText className="h-7 w-7 text-blue-600" />
                Invoice Kerja Sama
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Tagihan bulanan untuk akun postpaid, dari transaksi
                confirmed yang belum ditagih.
              </p>
            </div>
            {canGenerate && (
              <Button
                type="button"
                className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => setGenOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Generate Invoice
              </Button>
            )}
          </div>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Daftar invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="issued">Terkirim</SelectItem>
                    <SelectItem value="partially_paid">
                      Sebagian Lunas
                    </SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                    <SelectItem value="overdue">Jatuh Tempo</SelectItem>
                    <SelectItem value="void">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fetchList(page)}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
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
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Belum ada invoice.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Invoice</TableHead>
                          <TableHead>Akun</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Jatuh Tempo</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono text-sm">
                              {inv.invoice_no}
                            </TableCell>
                            <TableCell className="text-sm">
                              {inv.user?.company_name || inv.user?.name || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusBadgeClass(inv.status)}>
                                {KERJA_SAMA_INVOICE_STATUS_LABEL[inv.status] ??
                                  inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {formatDateIdLong(inv.due_date)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right tabular-nums">
                              {formatRupiah(inv.grand_total)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/kerja-sama/invoices/${inv.id}`
                                  )
                                }
                              >
                                <Eye className="h-4 w-4" />
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
                    <span>
                      Halaman {page} dari {lastPage} · Total {total} invoice
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchList(page - 1)}
                        disabled={page <= 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchList(page + 1)}
                        disabled={page >= lastPage || loading}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog
          open={genOpen}
          onOpenChange={(open) => {
            setGenOpen(open);
            if (!open) resetGenerateForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
              <DialogDescription>
                Semua transaksi berstatus confirmed yang belum ditagih akan
                otomatis diikutkan, apa pun tanggalnya. Periode di bawah
                hanya label administratif.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative" ref={accountInputRef}>
                <Label htmlFor="account-search">
                  Akun Kerja Sama <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="account-search"
                    placeholder="Cari nama/email/perusahaan…"
                    value={accountQuery}
                    onChange={(e) => {
                      setAccountQuery(e.target.value);
                      setSelectedAccount(null);
                    }}
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {searchingAccount ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                      <Search className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {showAccountResults && accountResults.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                    {accountResults.map((acc) => (
                      <div
                        key={acc.id}
                        className="cursor-pointer border-b p-3 last:border-b-0 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedAccount(acc);
                          setAccountQuery(
                            `${acc.company_name || acc.name} (${acc.email})`
                          );
                          setShowAccountResults(false);
                        }}
                      >
                        <p className="text-sm font-medium">
                          {acc.company_name || acc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {acc.email}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Periode Mulai</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Periode Akhir</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGenOpen(false)}
                disabled={genSaving}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void submitGenerate()}
                disabled={genSaving}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {genSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

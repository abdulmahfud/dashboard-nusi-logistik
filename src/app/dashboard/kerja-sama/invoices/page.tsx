"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
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
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { useAuth } from "@/context/AuthContext";
import { formatDateIdLong } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import {
  generateKerjaSamaInvoice,
  getKerjaSamaAccounts,
  getKerjaSamaInvoices,
} from "@/lib/apiClient";
import type { KerjaSamaAccount, KerjaSamaInvoice } from "@/types/kerjaSama";
import { AxiosError } from "axios";
import {
  Download,
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
import ExportInvoicesDialog from "./export-invoices-dialog";
import { InvoiceStatusBadge } from "./status-badge";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { message?: string })?.message || fallback;
  }
  return fallback;
}

const headCls = "h-11 text-xs font-semibold text-slate-500";
const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";

export default function KerjaSamaInvoicesPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<KerjaSamaInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
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
  const canExport = hasPermission("exports.kerja-sama-invoices");
  const [exportOpen, setExportOpen] = useState(false);
  // "Belum Lunas" = gabungan issued + partially_paid + overdue — API tidak
  // dukung filter multi-status sekaligus, jadi FE panggil 3x lalu digabung.
  // Lihat docs/be-fe/tracking-invoice-overdue-corporate.md §2.
  const isUnpaidView = statusFilter === "unpaid";
  const UNPAID_STATUSES = ["issued", "partially_paid", "overdue"] as const;
  const UNPAID_FETCH_CAP = 100;

  const fetchList = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError(null);
      try {
        if (statusFilter === "unpaid") {
          const responses = await Promise.all(
            UNPAID_STATUSES.map((status) =>
              getKerjaSamaInvoices({
                page: 1,
                per_page: UNPAID_FETCH_CAP,
                status,
              })
            )
          );
          const merged = responses.flatMap((r) => r.data.data);
          merged.sort(
            (a, b) =>
              new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
          setRows(merged);
          setPage(1);
          setLastPage(1);
          setTotal(responses.reduce((sum, r) => sum + r.data.total, 0));
        } else {
          const res = await getKerjaSamaInvoices({
            page: targetPage,
            per_page: perPage,
            status: statusFilter === "all" ? undefined : statusFilter,
          });
          setRows(res.data.data);
          setPage(res.data.current_page);
          setLastPage(res.data.last_page);
          setTotal(res.data.total);
        }
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat daftar invoice."));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusFilter, perPage]
  );

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
  };

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
  }, [authLoading, hasPermission, statusFilter, perPage]);

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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Invoice Kerja Sama" },
            ]}
            icon={ReceiptText}
            title="Invoice Kerja Sama"
            description="Tagihan bulanan untuk akun postpaid, dari transaksi confirmed yang belum ditagih."
            action={
              canGenerate || canExport ? (
                <div className="flex flex-wrap items-center gap-2">
                  {canExport && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 gap-2 rounded-lg border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => setExportOpen(true)}
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      Export
                    </Button>
                  )}
                  {canGenerate && (
                    <Button
                      type="button"
                      className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                      onClick={() => setGenOpen(true)}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Generate Invoice
                    </Button>
                  )}
                </div>
              ) : undefined
            }
          />

          <SectionCard icon={ReceiptText} title="Daftar Invoice">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-full sm:w-[240px] ${fieldCls}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="unpaid">
                    Belum Lunas (Terkirim + Sebagian + Jatuh Tempo)
                  </SelectItem>
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
                className="h-11 gap-2 rounded-lg border-slate-200"
                onClick={() => fetchList(page)}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
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
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada invoice.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className={headCls}>No. Invoice</TableHead>
                        <TableHead className={headCls}>Akun</TableHead>
                        <TableHead className={headCls}>Status</TableHead>
                        <TableHead className={headCls}>Jatuh Tempo</TableHead>
                        <TableHead className={`${headCls} text-right`}>
                          Total
                        </TableHead>
                        <TableHead className={`${headCls} text-right`}>
                          Dibayar
                        </TableHead>
                        <TableHead className={`${headCls} text-right`}>
                          Sisa
                        </TableHead>
                        <TableHead className={`${headCls} text-right`}>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((inv) => {
                        const grandTotal = Number(inv.grand_total) || 0;
                        const paidAmount = Number(inv.paid_amount) || 0;
                        const remaining = Math.max(
                          grandTotal - paidAmount,
                          0
                        );
                        return (
                          <TableRow
                            key={inv.id}
                            className="border-slate-100 hover:bg-slate-50/60"
                          >
                            <TableCell className="py-4 font-mono text-xs text-slate-700">
                              {inv.invoice_no}
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-700">
                              {inv.user?.company_name || inv.user?.name || "—"}
                            </TableCell>
                            <TableCell className="py-4">
                              <InvoiceStatusBadge status={inv.status} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                              {formatDateIdLong(inv.due_date)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-right text-sm font-medium tabular-nums text-slate-900">
                              {formatRupiah(grandTotal)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-right text-sm tabular-nums text-emerald-700">
                              {formatRupiah(paidAmount)}
                            </TableCell>
                            <TableCell
                              className={`whitespace-nowrap py-4 text-right text-sm font-medium tabular-nums ${
                                remaining > 0
                                  ? "text-rose-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {formatRupiah(remaining)}
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5 rounded-lg border-slate-200"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/kerja-sama/invoices/${inv.id}`
                                  )
                                }
                              >
                                <Eye className="h-3.5 w-3.5" aria-hidden />
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {isUnpaidView ? (
                  <p className="text-sm text-slate-500">
                    Total {total} invoice belum lunas — menampilkan hingga{" "}
                    {UNPAID_FETCH_CAP} invoice per status (Terkirim, Sebagian
                    Lunas, Jatuh Tempo), diurutkan dari jatuh tempo terdekat.
                  </p>
                ) : (
                  <NumberedPagination
                    page={page}
                    lastPage={lastPage}
                    total={total}
                    perPage={perPage}
                    disabled={loading}
                    onPageChange={(p) => void fetchList(p)}
                    onPerPageChange={handlePerPageChange}
                  />
                )}
              </div>
            )}
          </SectionCard>
        </div>

        <Dialog
          open={genOpen}
          onOpenChange={(open) => {
            setGenOpen(open);
            if (!open) resetGenerateForm();
          }}
        >
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ReceiptText className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <DialogTitle>Generate Invoice</DialogTitle>
                  <DialogDescription>
                    Semua transaksi berstatus confirmed yang belum ditagih
                    akan otomatis diikutkan, apa pun tanggalnya. Periode di
                    bawah hanya label administratif.
                  </DialogDescription>
                </div>
              </div>
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
                    className={fieldCls}
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
                  <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {accountResults.map((acc) => (
                      <div
                        key={acc.id}
                        className="cursor-pointer border-b border-slate-100 p-3 last:border-b-0 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedAccount(acc);
                          setAccountQuery(
                            `${acc.company_name || acc.name} (${acc.email})`
                          );
                          setShowAccountResults(false);
                        }}
                      >
                        <p className="text-sm font-medium text-slate-900">
                          {acc.company_name || acc.name}
                        </p>
                        <p className="text-xs text-slate-500">{acc.email}</p>
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
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Periode Akhir</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className={fieldCls}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
                onClick={() => setGenOpen(false)}
                disabled={genSaving}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void submitGenerate()}
                disabled={genSaving}
                className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
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

        {canExport && (
          <ExportInvoicesDialog
            open={exportOpen}
            onOpenChange={setExportOpen}
            initialStatus={statusFilter}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

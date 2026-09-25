"use client";

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatCard } from "@/components/redesign/stat-card";
import { StatusBadge } from "@/components/redesign/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExportAllPaymentsDialog from "@/components/wallet/export-all-payments-dialog";
import { useAuth } from "@/context/AuthContext";
import { getAllPayments, normalizeAllPayments } from "@/lib/apiClient";
import type { PaymentAllItem, PaymentAllSummary } from "@/types/payment";
import { formatDateTimeId } from "@/lib/date";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardListIcon,
  DollarSign,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  XCircle,
} from "lucide-react";

type FilterState = {
  search: string;
  status: string;
  payment_method: string;
  date_from: string;
  date_to: string;
  amount_min: string;
  amount_max: string;
  reference_no: string;
};

const initialFilters: FilterState = {
  search: "",
  status: "all",
  payment_method: "all",
  date_from: "",
  date_to: "",
  amount_min: "",
  amount_max: "",
  reference_no: "",
};

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-700";
const headCls = "h-11 text-xs font-semibold text-slate-500";

function formatAmount(value: number | string | undefined): string {
  const n =
    typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);
  if (!Number.isFinite(n)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function extractPagination(payload: unknown): {
  currentPage: number;
  lastPage: number;
  total: number;
} {
  const fallback = { currentPage: 1, lastPage: 1, total: 0 };
  if (!payload || typeof payload !== "object") return fallback;

  const root = payload as Record<string, unknown>;
  const direct = root.pagination;
  if (direct && typeof direct === "object") {
    const p = direct as Record<string, unknown>;
    const currentPage = Number(p.current_page);
    const lastPage = Number(p.last_page);
    const total = Number(p.total);
    return {
      currentPage: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
      lastPage: Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1,
      total: Number.isFinite(total) && total >= 0 ? total : 0,
    };
  }

  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    const currentPage = Number(d.current_page);
    const lastPage = Number(d.last_page);
    const total = Number(d.total);
    return {
      currentPage: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
      lastPage: Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1,
      total: Number.isFinite(total) && total >= 0 ? total : 0,
    };
  }

  return fallback;
}

export default function LaporanSemuaPembayaranPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const canViewAll = hasPermission("payments.view_all");
  const canExport = hasPermission("exports.transactions");
  const [exportOpen, setExportOpen] = useState(false);

  /** Isi field yang sedang diketik; baru dikirim saat "Terapkan Filter". */
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  /** Filter yang benar-benar dipakai untuk request. */
  const [applied, setApplied] = useState<FilterState>(initialFilters);
  const [rows, setRows] = useState<PaymentAllItem[]>([]);
  const [summary, setSummary] = useState<PaymentAllSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    if (!canViewAll) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAllPayments({
        search: applied.search || undefined,
        status: applied.status === "all" ? undefined : applied.status,
        payment_method:
          applied.payment_method === "all" ? undefined : applied.payment_method,
        date_from: applied.date_from || undefined,
        date_to: applied.date_to || undefined,
        amount_min: applied.amount_min ? Number(applied.amount_min) : undefined,
        amount_max: applied.amount_max ? Number(applied.amount_max) : undefined,
        reference_no: applied.reference_no || undefined,
        page,
        per_page: perPage,
      });
      setRows(normalizeAllPayments(res) as PaymentAllItem[]);
      const pg = extractPagination(res);
      setLastPage(pg.lastPage);
      setTotal(pg.total);
      setSummary(res.summary ?? null);
    } catch (e) {
      if (e instanceof AxiosError) {
        const msg = (e.response?.data as { message?: string })?.message;
        setError(msg || "Gagal memuat laporan semua pembayaran.");
      } else {
        setError("Gagal memuat laporan semua pembayaran.");
      }
      setRows([]);
      setLastPage(1);
      setTotal(0);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [canViewAll, applied, page, perPage]);

  useEffect(() => {
    if (!authLoading && canViewAll) {
      void loadData();
    }
  }, [authLoading, canViewAll, loadData]);

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const applyFilters = () => {
    setApplied({ ...filters });
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setApplied(initialFilters);
    setPage(1);
  };

  const byStatus = summary?.by_status;
  const failedBucket = byStatus
    ? {
        count: byStatus.failed.count + byStatus.expired.count,
        total_amount: byStatus.failed.total_amount + byStatus.expired.total_amount,
      }
    : null;
  const bucketValue = (count: number | undefined) =>
    count !== undefined ? String(count) : loading ? "…" : "–";
  const bucketPercent = (count: number | undefined, fallback: string) =>
    count !== undefined && summary && summary.total > 0
      ? `${((count / summary.total) * 100).toFixed(1)}% dari total`
      : fallback;

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

  if (!canViewAll) return null;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Laporan Semua Pembayaran" },
            ]}
            icon={ClipboardListIcon}
            title="Laporan Semua Pembayaran"
            description="Riwayat semua pembayaran dengan filter admin."
            illustration="/images/report.png"
            illustrationClassName="w-[120px]"
            actionBelowIllustration
            action={
              canExport ? (
                <Button
                  type="button"
                  className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  onClick={() => setExportOpen(true)}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Export
                </Button>
              ) : undefined
            }
          />

          <SectionCard
            icon={SlidersHorizontal}
            title="Filter Transaksi"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="f-search" className={labelCls}>
                    Cari Email / Nama
                  </Label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="f-search"
                      placeholder="Cari email atau nama pengguna..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, search: e.target.value }))
                      }
                      className={`${fieldCls} pl-9`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="f-status" className={labelCls}>
                    Status
                  </Label>
                  <Select
                    value={filters.status}
                    onValueChange={(v) =>
                      setFilters((p) => ({ ...p, status: v }))
                    }
                  >
                    <SelectTrigger id="f-status" className={fieldCls}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="f-method" className={labelCls}>
                    Metode
                  </Label>
                  <Select
                    value={filters.payment_method}
                    onValueChange={(v) =>
                      setFilters((p) => ({ ...p, payment_method: v }))
                    }
                  >
                    <SelectTrigger id="f-method" className={fieldCls}>
                      <SelectValue placeholder="Metode bayar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Metode</SelectItem>
                      <SelectItem value="xendit">Xendit</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="cod">COD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="f-ref" className={labelCls}>
                    Reference No
                  </Label>
                  <Input
                    id="f-ref"
                    placeholder="Masukkan Reference No"
                    value={filters.reference_no}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, reference_no: e.target.value }))
                    }
                    className={fieldCls}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="f-from" className={labelCls}>
                    Tanggal Dari
                  </Label>
                  <div className="relative">
                    <Calendar
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="f-from"
                      type="date"
                      value={filters.date_from}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, date_from: e.target.value }))
                      }
                      className={`${fieldCls} pl-9`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="f-to" className={labelCls}>
                    Tanggal Sampai
                  </Label>
                  <div className="relative">
                    <Calendar
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="f-to"
                      type="date"
                      value={filters.date_to}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, date_to: e.target.value }))
                      }
                      className={`${fieldCls} pl-9`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="f-amin" className={labelCls}>
                    Amount Min
                  </Label>
                  <Input
                    id="f-amin"
                    placeholder="Min. Amount"
                    value={filters.amount_min}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        amount_min: e.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    className={fieldCls}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="f-amax" className={labelCls}>
                    Amount Max
                  </Label>
                  <Input
                    id="f-amax"
                    placeholder="Max. Amount"
                    value={filters.amount_max}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        amount_max: e.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    className={fieldCls}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    <>
                      <Filter className="h-4 w-4" aria-hidden />
                      Terapkan Filter
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  disabled={loading}
                  className="h-10 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadData()}
                  disabled={loading}
                  className="h-10 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  Refresh
                </Button>
              </div>
            </form>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              icon={DollarSign}
              tone="blue"
              title="Total Transaksi"
              value={bucketValue(summary?.total)}
              hint="Semua transaksi"
            />
            <StatCard
              icon={CheckCircle2}
              tone="green"
              title="Transaksi Berhasil"
              value={bucketValue(byStatus?.paid.count)}
              hint={bucketPercent(byStatus?.paid.count, "Pembayaran sukses")}
            />
            <StatCard
              icon={Clock}
              tone="orange"
              title="Menunggu"
              value={bucketValue(byStatus?.pending.count)}
              hint={bucketPercent(byStatus?.pending.count, "Menunggu pembayaran")}
            />
            <StatCard
              icon={XCircle}
              tone="red"
              title="Gagal"
              value={bucketValue(failedBucket?.count)}
              hint={bucketPercent(failedBucket?.count, "Gagal atau kedaluwarsa")}
            />
            <StatCard
              icon={TrendingUp}
              tone="violet"
              title="Total Amount"
              value={
                summary?.total_amount !== undefined
                  ? formatAmount(summary.total_amount)
                  : loading
                    ? "…"
                    : "–"
              }
              hint="Semua transaksi"
            />
          </div>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Data Pembayaran ({total})
            </h2>

            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada data untuk filter ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className={`${headCls} w-14`}>No</TableHead>
                      <TableHead className={headCls}>Reference No</TableHead>
                      <TableHead className={headCls}>User</TableHead>
                      <TableHead className={headCls}>Metode</TableHead>
                      <TableHead className={headCls}>Status</TableHead>
                      <TableHead className={`${headCls} text-right`}>
                        Amount
                      </TableHead>
                      <TableHead className={headCls}>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => {
                      const dt = formatDateTimeId(row.created_at);
                      return (
                        <TableRow
                          key={`${row.id ?? row.reference_no ?? i}`}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4 text-sm text-slate-700">
                            {(page - 1) * perPage + i + 1}
                          </TableCell>
                          <TableCell className="py-4 font-mono text-xs text-slate-700">
                            {row.reference_no || "-"}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                                {row.user?.name?.[0]?.toUpperCase() ?? "?"}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900">
                                  {row.user?.name || "-"}
                                </p>
                                {row.user?.email ? (
                                  <p className="truncate text-xs text-slate-500">
                                    {row.user.email}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {row.payment_method ? (
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase text-blue-700">
                                {row.payment_method}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-right text-sm font-semibold tabular-nums text-slate-900">
                            {formatAmount(row.amount)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                            {dt ? `${dt.date}, ${dt.time.slice(0, 5)}` : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <NumberedPagination
                  className="mt-2"
                  page={page}
                  lastPage={lastPage}
                  total={total}
                  perPage={perPage}
                  disabled={loading}
                  onPageChange={setPage}
                  onPerPageChange={handlePerPageChange}
                />
              </div>
            )}
          </section>
        </div>

        {canExport && (
          <ExportAllPaymentsDialog
            open={exportOpen}
            onOpenChange={setExportOpen}
            initialStatus={applied.status}
            initialPaymentMethod={applied.payment_method}
            initialSearch={applied.search}
            initialDateFrom={applied.date_from}
            initialDateTo={applied.date_to}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

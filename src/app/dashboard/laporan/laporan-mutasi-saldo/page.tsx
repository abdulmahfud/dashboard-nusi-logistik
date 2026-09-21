"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatCard } from "@/components/redesign/stat-card";
import { StatusBadge } from "@/components/redesign/status-badge";
import {
  DateRangeField,
  toApiDate,
} from "@/components/redesign/date-range-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  ClipboardListIcon,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Wallet,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { AxiosError } from "axios";
import { getPaymentHistory } from "@/lib/apiClient";
import { formatDateTimeId } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import type {
  PaymentHistoryQuery,
  PaymentHistorySummary,
  PaymentStatus,
} from "@/types/payment";

type StatusValue = "all" | NonNullable<PaymentHistoryQuery["status"]>;

/** Filter yang sedang diterapkan ke request. */
type AppliedFilters = {
  search: string;
  status: StatusValue;
  dateFrom?: string;
  dateTo?: string;
};

const NO_FILTERS: AppliedFilters = { search: "", status: "all" };

const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Sukses" },
  { value: "failed", label: "Gagal" },
  { value: "expired", label: "Kedaluwarsa" },
];

/** Label ramah untuk `payment_method` (paid saja). */
const METHOD_LABEL: Record<string, string> = {
  WALLET: "Saldo Wallet",
  COD: "Saldo Masuk COD",
  BANK_TRANSFER: "Transfer Bank",
  EWALLET: "E-Wallet",
  QR_CODE: "QRIS",
  UNKNOWN: "Tidak Tercatat",
};

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-700";
const headCls = "h-11 text-xs font-semibold text-slate-500";

const mapMutation = (item: PaymentStatus): string => {
  if (item.reference_no) return `Pembayaran ${String(item.reference_no)}`;
  if (item.invoice_id) return `Invoice ${String(item.invoice_id)}`;
  return "Mutasi pembayaran";
};

function StatusCell({ status }: { status: string | undefined }) {
  const s = (status || "").toLowerCase();
  if (s === "paid" || s === "success")
    return <StatusBadge status="success" label="Sukses" />;
  if (s === "failed") return <StatusBadge status="failed" label="Gagal" />;
  if (s === "expired")
    return <StatusBadge status="failed" label="Kedaluwarsa" />;
  if (s === "pending")
    return <StatusBadge status="pending" label="Pending" />;
  return <StatusBadge status={status} />;
}

function DateCell({ value }: { value: string | undefined }) {
  const dt = formatDateTimeId(value);
  if (!dt) return <span className="text-slate-400">—</span>;
  return (
    <span className="text-slate-900">
      {dt.date} {dt.time.slice(0, 5)}
    </span>
  );
}

const LaporanMutasiSaldo = () => {
  // Isi field yang sedang diketik; baru dikirim saat "Terapkan Filter".
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState<StatusValue>("all");
  const [rangeInput, setRangeInput] = useState<DateRange | undefined>();
  const [applied, setApplied] = useState<AppliedFilters>(NO_FILTERS);

  const [rows, setRows] = useState<PaymentStatus[]>([]);
  const [summary, setSummary] = useState<PaymentHistorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const hasFilter = Boolean(
    applied.search || applied.status !== "all" || applied.dateFrom
  );

  const loadMutasi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPaymentHistory({
        search: applied.search || undefined,
        status: applied.status === "all" ? undefined : applied.status,
        date_from: applied.dateFrom,
        date_to: applied.dateTo,
        page,
        per_page: perPage,
      });
      setRows(res.data ?? []);
      setLastPage(res.pagination?.last_page ?? 1);
      setTotal(res.pagination?.total ?? res.data?.length ?? 0);
      setSummary(res.summary ?? null);
    } catch (e) {
      if (e instanceof AxiosError) {
        const msg = (e.response?.data as { message?: string })?.message;
        setError(msg || "Gagal memuat data mutasi saldo.");
      } else {
        setError("Gagal memuat data mutasi saldo.");
      }
      setRows([]);
      setLastPage(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [applied, page, perPage]);

  useEffect(() => {
    void loadMutasi();
  }, [loadMutasi]);

  const applyFilters = () => {
    // Satu tanggal yang dipilih berarti pembayaran pada hari itu saja.
    const from = rangeInput?.from;
    const to = rangeInput?.to ?? rangeInput?.from;
    setApplied({
      search: searchInput.trim(),
      status: statusInput,
      dateFrom: from ? toApiDate(from) : undefined,
      dateTo: to ? toApiDate(to) : undefined,
    });
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setStatusInput("all");
    setRangeInput(undefined);
    setApplied(NO_FILTERS);
    setPage(1);
  };

  const byStatus = summary?.by_status;
  const failedBucket = byStatus
    ? {
        count: byStatus.failed.count + byStatus.expired.count,
        total_amount:
          byStatus.failed.total_amount + byStatus.expired.total_amount,
      }
    : null;
  const bucketValue = (count: number | undefined) =>
    count !== undefined ? String(count) : loading ? "…" : "–";
  const bucketHint = (amount: number | undefined, fallback: string) =>
    amount !== undefined ? `Nilai ${formatRupiah(amount)}` : fallback;

  const methodEntries = Object.entries(summary?.by_payment_method ?? {});

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
              { label: "Laporan Mutasi Saldo" },
            ]}
            icon={ClipboardListIcon}
            title="Laporan Mutasi Saldo"
            description="Riwayat pembayaran (saldo wallet, transfer, dan COD) dengan filter admin."
            illustration="/images/business-report.png"
            illustrationClassName="w-[120px]"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ClipboardListIcon}
              tone="blue"
              title="Total Mutasi"
              value={bucketValue(summary?.total)}
              hint={bucketHint(summary?.total_amount, "Semua transaksi mutasi")}
            />
            <StatCard
              icon={CheckCircle2}
              tone="green"
              title="Berhasil"
              value={bucketValue(byStatus?.paid.count)}
              hint={bucketHint(byStatus?.paid.total_amount, "Pembayaran sukses")}
            />
            <StatCard
              icon={Clock}
              tone="orange"
              title="Menunggu"
              value={bucketValue(byStatus?.pending.count)}
              hint={bucketHint(
                byStatus?.pending.total_amount,
                "Menunggu pembayaran"
              )}
            />
            <StatCard
              icon={XCircle}
              tone="red"
              title="Gagal / Kedaluwarsa"
              value={bucketValue(failedBucket?.count)}
              hint={bucketHint(
                failedBucket?.total_amount,
                "Gagal atau kedaluwarsa"
              )}
            />
          </div>

          {methodEntries.length > 0 && (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Wallet className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-semibold leading-tight text-slate-900">
                    Pembayaran Berhasil per Metode
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Pemakaian saldo wallet, transfer langsung, dan saldo masuk
                    COD.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {methodEntries.map(([method, bucket]) => (
                  <div
                    key={method}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <p className="text-xs text-slate-500">
                      {METHOD_LABEL[method] ?? method}
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                      {formatRupiah(bucket.total_amount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {bucket.count} transaksi
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <SectionCard icon={SlidersHorizontal} title="Filter Transaksi">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="f-search" className={labelCls}>
                    Cari Data
                  </Label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="f-search"
                      placeholder="Cari referensi, invoice, atau metode..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className={`${fieldCls} pl-9`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>Pilih Range Tanggal</Label>
                  <DateRangeField
                    value={rangeInput}
                    onChange={setRangeInput}
                    placeholder="Pilih rentang tanggal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-status" className={labelCls}>
                    Filter Status
                  </Label>
                  <Select
                    value={statusInput}
                    onValueChange={(v) => setStatusInput(v as StatusValue)}
                  >
                    <SelectTrigger id="f-status" className={fieldCls}>
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  <Filter className="h-4 w-4" aria-hidden />
                  Terapkan Filter
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
                  onClick={() => void loadMutasi()}
                  disabled={loading}
                  className="h-10 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  Muat Ulang
                </Button>
              </div>
            </form>
          </SectionCard>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Data Transaksi
              </h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                {total} entri ditemukan
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className={`${headCls} w-14`}>No</TableHead>
                    <TableHead className={headCls}>Mutasi</TableHead>
                    <TableHead className={headCls}>Metode</TableHead>
                    <TableHead className={headCls}>Nilai</TableHead>
                    <TableHead className={headCls}>Status</TableHead>
                    <TableHead className={headCls}>
                      Tanggal Dibuat / Estimasi
                    </TableHead>
                    <TableHead className={headCls}>Tanggal Rilis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-slate-500"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memuat data mutasi saldo...
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-red-600"
                      >
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : rows.length ? (
                    rows.map((item, i) => (
                      <TableRow
                        key={`${item.reference_no}-${item.created_at}-${i}`}
                        className="border-slate-100 hover:bg-slate-50/60"
                      >
                        <TableCell className="py-4 text-sm text-slate-700">
                          {(page - 1) * perPage + i + 1}
                        </TableCell>
                        <TableCell className="py-4 text-sm text-slate-900">
                          {mapMutation(item)}
                        </TableCell>
                        <TableCell className="py-4">
                          {item.payment_method ? (
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase text-blue-700">
                              {item.payment_method}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4 text-sm font-medium tabular-nums text-slate-900">
                          {formatRupiah(Number(item.amount ?? 0) || 0)}
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusCell status={item.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4 text-sm">
                          <DateCell value={item.created_at} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4 text-sm">
                          <DateCell value={item.paid_at ?? item.expired_at} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <Image
                            src="/images/search.png"
                            alt="Tidak ada data"
                            width={100}
                            height={100}
                            className="h-32 w-32 object-contain"
                          />
                          <p className="text-sm font-medium text-slate-600">
                            Data Tidak Ditemukan
                          </p>
                          <p className="text-xs text-slate-400">
                            {hasFilter
                              ? "Tidak ada data untuk filter ini."
                              : "Belum ada data pembayaran."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {!loading && !error && rows.length > 0 && (
              <NumberedPagination
                className="mt-2"
                page={page}
                lastPage={lastPage}
                total={total}
                perPage={perPage}
                onPageChange={setPage}
                onPerPageChange={(n) => {
                  setPerPage(n);
                  setPage(1);
                }}
              />
            )}
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LaporanMutasiSaldo;

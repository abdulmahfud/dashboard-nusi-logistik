"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import {
  DateRangeField,
  toApiDate,
} from "@/components/redesign/date-range-field";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { StatCard } from "@/components/redesign/stat-card";
import { AccessDeniedCard } from "@/components/wallet/access-denied-card";
import ExportWalletHistoryDialog from "@/components/wallet/export-wallet-history-dialog";
import { WalletTransactionTable } from "@/components/wallet/wallet-transaction-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  getMyWalletTransactions,
  getWalletPaginatorMeta,
  getWalletSummary,
  normalizeWalletTransactions,
} from "@/lib/apiClient";
import { formatRupiah } from "@/lib/currency";
import type {
  WalletMyTransactionsQuery,
  WalletSummaryData,
  WalletTransactionItem,
} from "@/types/wallet";
import type { DateRange } from "react-day-picker";
import { AxiosError } from "axios";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  FileText,
  Filter,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/** "2026-07" -> "Juli 2026" */
function periodLabel(month: string | undefined): string | undefined {
  const m = /^(\d{4})-(\d{2})$/.exec(month ?? "");
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString(
    "id-ID",
    { month: "long", year: "numeric" }
  );
}

const TYPE_OPTIONS: { value: NonNullable<WalletMyTransactionsQuery["type"]>; label: string }[] = [
  { value: "topup", label: "Top-up" },
  { value: "payment", label: "Pembayaran" },
  { value: "withdraw", label: "Penarikan" },
  { value: "cod_income", label: "COD Masuk" },
];

/** Filter yang sedang diterapkan ke request (bukan isi field yang masih diketik). */
type AppliedFilters = {
  search: string;
  dateFrom?: string;
  dateTo?: string;
  type?: WalletMyTransactionsQuery["type"];
};

const NO_FILTERS: AppliedFilters = { search: "" };

export default function WalletRiwayatPage() {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const canView = hasPermission("wallet.view");
  const [exportOpen, setExportOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<WalletTransactionItem[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  /** Total seluruh riwayat (tanpa filter) untuk kartu "Total Transaksi". */
  const [allTotal, setAllTotal] = useState<number | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [rangeInput, setRangeInput] = useState<DateRange | undefined>();
  const [typeInput, setTypeInput] = useState("all");
  const [filters, setFilters] = useState<AppliedFilters>(NO_FILTERS);
  const hasFilters = Boolean(
    filters.search || filters.dateFrom || filters.dateTo || filters.type
  );

  const [summary, setSummary] = useState<WalletSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    if (!canView) {
      setSummaryLoading(false);
      return;
    }
    setSummaryLoading(true);
    try {
      const res = await getWalletSummary();
      setSummary(res.data ?? null);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [canView]);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await getMyWalletTransactions({
        page,
        per_page: perPage,
        search: filters.search || undefined,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        type: filters.type,
      });
      const list = normalizeWalletTransactions(res);
      setRows(list);
      const meta = getWalletPaginatorMeta(res);
      const count = meta ? meta.total : list.length;
      setLastPage(meta ? meta.last_page : 1);
      setTotal(count);
      const unfiltered =
        !filters.search && !filters.dateFrom && !filters.dateTo && !filters.type;
      if (unfiltered) setAllTotal(count);
    } catch (e) {
      console.error(e);
      if (e instanceof AxiosError && e.response?.status === 403) {
        setError(
          "Anda tidak berhak melihat riwayat wallet (izin: wallet.view)."
        );
      } else if (e instanceof AxiosError && e.response?.status === 422) {
        setError(
          (e.response.data as { message?: string })?.message ||
            "Filter yang dipilih tidak valid."
        );
      } else {
        setError("Gagal memuat riwayat transaksi.");
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canView, page, perPage, filters]);

  useEffect(() => {
    if (!authLoading && user && canView) {
      void load();
    }
    if (!authLoading && user && !canView) {
      setLoading(false);
    }
  }, [authLoading, user, canView, load]);

  useEffect(() => {
    if (!authLoading && user) {
      void loadSummary();
    }
  }, [authLoading, user, loadSummary]);

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const applyFilters = () => {
    // Satu tanggal yang dipilih berarti transaksi pada hari itu saja.
    const from = rangeInput?.from;
    const to = rangeInput?.to ?? rangeInput?.from;
    setFilters({
      search: searchInput.trim(),
      dateFrom: from ? toApiDate(from) : undefined,
      dateTo: to ? toApiDate(to) : undefined,
      type:
        typeInput === "all"
          ? undefined
          : (typeInput as WalletMyTransactionsQuery["type"]),
    });
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setRangeInput(undefined);
    setTypeInput("all");
    setFilters(NO_FILTERS);
    setPage(1);
  };

  const reload = () => {
    void load();
    void loadSummary();
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

  if (!user) return null;

  if (!canView) {
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
          <div className="flex flex-1 flex-col items-center justify-center bg-blue-50/80 p-6">
            <AccessDeniedCard
              title="Tidak dapat mengakses riwayat wallet"
              description="Menu ini memerlukan izin untuk melihat transaksi dompet Anda sendiri."
              permissionHint="wallet.view"
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const statValue = (pick: (s: WalletSummaryData) => string): string =>
    summary ? pick(summary) : summaryLoading ? "…" : "–";
  const monthHint = periodLabel(summary?.period.month);

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
              { label: "Riwayat Dompet" },
            ]}
            icon={History}
            title="Riwayat Dompet Saya"
            description="Hanya transaksi dompet milik Anda sendiri."
            illustration="/images/wallet4.png"
            illustrationClassName="w-[120px]"
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              tone="blue"
              title="Saldo Saat Ini"
              value={statValue((s) => formatRupiah(s.balance))}
              hint="Saldo tersedia untuk transaksi"
            />
            <StatCard
              icon={ArrowDownToLine}
              tone="green"
              title="Top-up Bulan Ini"
              value={statValue((s) => formatRupiah(s.total_topup))}
              hint={monthHint ?? "Saldo yang ditambahkan"}
            />
            <StatCard
              icon={ArrowUpFromLine}
              tone="red"
              title="Penggunaan Bulan Ini"
              value={statValue((s) => `-${formatRupiah(s.total_usage)}`)}
              hint={monthHint ?? "Saldo yang digunakan"}
            />
            <StatCard
              icon={FileText}
              tone="violet"
              title="Total Transaksi"
              value={
                allTotal !== null ? String(allTotal) : loading ? "…" : "–"
              }
              hint="Semua riwayat transaksi"
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="relative min-w-[220px] flex-1 md:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari referensi / keterangan..."
                aria-label="Cari referensi atau keterangan"
                className="h-11 rounded-lg border-slate-200 bg-white pl-9"
              />
            </div>
            <DateRangeField
              value={rangeInput}
              onChange={setRangeInput}
              className="w-full sm:w-[270px]"
            />
            <Select value={typeInput} onValueChange={setTypeInput}>
              <SelectTrigger
                className="h-11 w-full rounded-lg border-slate-200 bg-white sm:w-[210px]"
                aria-label="Jenis transaksi"
              >
                <SelectValue placeholder="Semua Jenis Transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis Transaksi</SelectItem>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              <Filter className="h-4 w-4" aria-hidden />
              Filter
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 gap-2 rounded-lg text-slate-600"
                onClick={resetFilters}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Reset
              </Button>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={reload}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Muat ulang
              </Button>
              {canView && (
                <Button
                  type="button"
                  className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  onClick={() => setExportOpen(true)}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Export
                </Button>
              )}
            </div>
          </form>

          <SectionCard
            icon={History}
            title="Transaksi"
            description={
              total > 0
                ? `${total} entri${hasFilters ? " (terfilter)" : ""}`
                : "Belum ada data"
            }
          >
            {error && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                {hasFilters
                  ? "Tidak ada transaksi untuk filter ini."
                  : "Belum ada transaksi dompet."}
              </p>
            ) : (
              <>
                <WalletTransactionTable rows={rows} />
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
              </>
            )}
          </SectionCard>
        </div>

        <ExportWalletHistoryDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          initialType={filters.type}
          initialSearch={filters.search}
          initialDateFrom={filters.dateFrom}
          initialDateTo={filters.dateTo}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

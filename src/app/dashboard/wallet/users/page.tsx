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
import { AccessDeniedCard } from "@/components/wallet/access-denied-card";
import { WalletTransactionTable } from "@/components/wallet/wallet-transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import {
  getAllWalletTransactions,
  getWalletPaginatorMeta,
  getWalletUsers,
  getWalletUsersSummary,
  normalizeWalletTransactions,
} from "@/lib/apiClient";
import type {
  WalletUserItem,
  WalletUsersQuery,
  WalletUsersSummaryData,
  WalletTransactionItem,
} from "@/types/wallet";
import { formatRupiah } from "@/lib/currency";
import { formatDateIdLong } from "@/lib/date";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  History,
  Loader2,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";

const PER_PAGE_OPTIONS = [10, 20, 30, 40, 50] as const;

const ACCOUNT_TYPE_OPTIONS = [
  { value: "personal", label: "Personal" },
  { value: "corporate", label: "Corporate" },
] as const;

const SORT_OPTIONS = [
  { value: "balance_desc", label: "Saldo Tertinggi" },
  { value: "balance_asc", label: "Saldo Terendah" },
  { value: "latest", label: "Terbaru Daftar" },
] as const;

const fieldCls = "h-10 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-700";

function summaryValue(
  summary: WalletUsersSummaryData | null,
  loading: boolean,
  pick: (s: WalletUsersSummaryData) => string
): string {
  if (loading) return "…";
  if (!summary) return "–";
  return pick(summary);
}

export default function WalletUsersPage() {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const canView = hasPermission("wallet.users.view");

  // Ringkasan global
  const [summary, setSummary] = useState<WalletUsersSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Daftar user
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<WalletUserItem[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState<string>("__all");
  const [balanceMin, setBalanceMin] = useState("");
  const [balanceMax, setBalanceMax] = useState("");
  const [sort, setSort] = useState<string>("balance_desc");
  const [filterTick, setFilterTick] = useState(0);

  // Dialog detail riwayat
  const [detailUser, setDetailUser] = useState<WalletUserItem | null>(null);
  const [detailRows, setDetailRows] = useState<WalletTransactionItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailForbidden, setDetailForbidden] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [detailLastPage, setDetailLastPage] = useState(1);
  const [detailTotal, setDetailTotal] = useState(0);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await getWalletUsersSummary();
      setSummary(res.data ?? null);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user || !canView) {
      if (!authLoading && user && !canView) setSummaryLoading(false);
      return;
    }
    void loadSummary();
  }, [authLoading, user, canView, loadSummary]);

  useEffect(() => {
    if (authLoading || !user || !canView) {
      if (!authLoading && user && !canView) setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setForbidden(false);
      setError(null);
      setLoading(true);

      const q: WalletUsersQuery = { page, per_page: perPage };
      if (search.trim()) q.search = search.trim();
      if (accountType !== "__all") {
        q.account_type = accountType as WalletUsersQuery["account_type"];
      }
      const bmin = parseFloat(balanceMin.replace(/\./g, ""));
      if (Number.isFinite(bmin)) q.balance_min = bmin;
      const bmax = parseFloat(balanceMax.replace(/\./g, ""));
      if (Number.isFinite(bmax)) q.balance_max = bmax;
      if (sort) q.sort = sort as WalletUsersQuery["sort"];

      try {
        const res = await getWalletUsers(q);
        if (cancelled) return;
        setRows(res.data?.data ?? []);
        setLastPage(res.data?.last_page ?? 1);
        setTotal(res.data?.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof AxiosError && e.response?.status === 403) {
          setForbidden(true);
          setRows([]);
        } else {
          setError(
            e instanceof AxiosError
              ? (e.response?.data as { message?: string })?.message ||
                "Gagal memuat data."
              : "Gagal memuat data."
          );
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // Hanya refetch saat navigasi halaman atau setelah Terapkan/Reset/Muat ulang (filterTick).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nilai filter dibaca dari state terkini saat filterTick berubah
  }, [authLoading, user, canView, page, perPage, filterTick]);

  const applyFilters = () => {
    setPage(1);
    setFilterTick((t) => t + 1);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
    setFilterTick((t) => t + 1);
  };

  const resetFilters = () => {
    setSearch("");
    setAccountType("__all");
    setBalanceMin("");
    setBalanceMax("");
    setSort("balance_desc");
    setPage(1);
    setPerPage(20);
    setFilterTick((t) => t + 1);
  };

  const loadDetail = useCallback(
    async (u: WalletUserItem, p: number) => {
      setDetailLoading(true);
      setDetailForbidden(false);
      setDetailError(null);
      try {
        const res = await getAllWalletTransactions({
          user_id: u.id,
          page: p,
          per_page: 10,
        });
        const list = normalizeWalletTransactions(res);
        setDetailRows(list);
        const meta = getWalletPaginatorMeta(res);
        if (meta) {
          setDetailLastPage(meta.last_page);
          setDetailTotal(meta.total);
        } else {
          setDetailLastPage(1);
          setDetailTotal(list.length);
        }
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 403) {
          setDetailForbidden(true);
          setDetailRows([]);
        } else {
          setDetailError("Gagal memuat riwayat transaksi.");
          setDetailRows([]);
        }
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  const openDetail = (u: WalletUserItem) => {
    setDetailUser(u);
    setDetailPage(1);
    void loadDetail(u, 1);
  };

  const handleDetailPageChange = (p: number) => {
    setDetailPage(p);
    if (detailUser) void loadDetail(detailUser, p);
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
              title="Tidak dapat mengakses halaman ini"
              description="Hanya akun dengan izin melihat wallet semua user yang dapat membuka halaman ini."
              permissionHint="wallet.users.view"
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
              { label: "Wallet User" },
            ]}
            icon={Users}
            title="Wallet User"
            description="Lihat dan kelola saldo wallet seluruh pengguna."
          />

          {forbidden && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-start gap-3 pt-6 text-sm text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Akses ditolak (403)</p>
                  <p>
                    Izin yang diperlukan:{" "}
                    <code className="rounded bg-white px-1">
                      wallet.users.view
                    </code>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Wallet}
              tone="blue"
              title="Total Saldo Semua User"
              value={summaryValue(summary, summaryLoading, (s) =>
                formatRupiah(s.total_balance)
              )}
            />
            <StatCard
              icon={Users}
              tone="slate"
              title="User dengan Saldo"
              value={summaryValue(
                summary,
                summaryLoading,
                (s) => `${s.users_with_balance} / ${s.user_count}`
              )}
              hint="Jumlah user bersaldo > 0 dari total user"
            />
            <StatCard
              icon={ArrowUpFromLine}
              tone="green"
              title="Top-up Bulan Ini"
              value={summaryValue(summary, summaryLoading, (s) =>
                formatRupiah(s.total_topup_this_month)
              )}
            />
            <StatCard
              icon={TrendingDown}
              tone="red"
              title="Penggunaan Bulan Ini"
              value={summaryValue(summary, summaryLoading, (s) =>
                formatRupiah(s.total_usage_this_month)
              )}
            />
          </div>

          <SectionCard
            icon={SlidersHorizontal}
            title="Filter"
            description="Cari dan saring daftar wallet user."
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="f-search" className={labelCls}>
                    Cari (Nama / Email)
                  </Label>
                  <Input
                    id="f-search"
                    placeholder="Cari nama atau email..."
                    className={fieldCls}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>Tipe Akun</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger className={fieldCls}>
                      <SelectValue placeholder="Semua tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Semua tipe</SelectItem>
                      {ACCOUNT_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-bmin" className={labelCls}>
                    Saldo Min (Rp)
                  </Label>
                  <Input
                    id="f-bmin"
                    placeholder="Contoh: 10000"
                    className={fieldCls}
                    value={balanceMin}
                    onChange={(e) => setBalanceMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-bmax" className={labelCls}>
                    Saldo Max (Rp)
                  </Label>
                  <Input
                    id="f-bmax"
                    placeholder="Contoh: 1000000"
                    className={fieldCls}
                    value={balanceMax}
                    onChange={(e) => setBalanceMax(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>Urutkan</Label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className={fieldCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>Per Halaman</Label>
                  <Select
                    value={String(perPage)}
                    onValueChange={(v) => handlePerPageChange(Number(v))}
                  >
                    <SelectTrigger className={fieldCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PER_PAGE_OPTIONS.map((n) => (
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
                  onClick={applyFilters}
                  className="h-10 gap-2 rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-700"
                >
                  <Filter className="h-4 w-4" />
                  Terapkan Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-10 gap-2 rounded-lg border-slate-200 px-4 text-blue-700 hover:bg-blue-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void loadSummary();
                    setFilterTick((t) => t + 1);
                  }}
                  disabled={loading}
                  className="h-10 gap-2 rounded-lg border-slate-200 px-4 text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Muat Ulang
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={ReceiptText}
            title="Daftar Wallet User"
            description={total > 0 ? `${total} user` : "Tidak ada data"}
          >
            {error && !forbidden && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : forbidden ? null : rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Tidak ada user untuk filter ini.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/60">
                      <tr className="border-b border-slate-100">
                        <th className="h-11 px-4 text-left text-xs font-semibold text-slate-500">
                          Nama
                        </th>
                        <th className="h-11 px-4 text-left text-xs font-semibold text-slate-500">
                          Email
                        </th>
                        <th className="h-11 px-4 text-left text-xs font-semibold text-slate-500">
                          Tipe Akun
                        </th>
                        <th className="h-11 px-4 text-right text-xs font-semibold text-slate-500">
                          Saldo
                        </th>
                        <th className="h-11 px-4 text-left text-xs font-semibold text-slate-500">
                          Terdaftar
                        </th>
                        <th className="h-11 px-4 text-right text-xs font-semibold text-slate-500">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.email}
                          </td>
                          <td className="px-4 py-3 text-slate-600 capitalize">
                            {row.account_type ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                            {formatRupiah(row.balance)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.created_at
                              ? formatDateIdLong(row.created_at)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openDetail(row)}
                              className="h-8 gap-1.5 rounded-lg border-slate-200 text-blue-700 hover:bg-blue-50"
                            >
                              <History className="h-3.5 w-3.5" aria-hidden />
                              Lihat Riwayat
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

        <Dialog
          open={detailUser !== null}
          onOpenChange={(open) => {
            if (!open) setDetailUser(null);
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-blue-600" aria-hidden />
                Riwayat Wallet — {detailUser?.name}
              </DialogTitle>
              <DialogDescription>
                {detailUser?.email} — Saldo saat ini:{" "}
                <span className="font-semibold text-slate-900">
                  {detailUser ? formatRupiah(detailUser.balance) : "-"}
                </span>
              </DialogDescription>
            </DialogHeader>

            {detailForbidden ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Anda tidak memiliki izin{" "}
                <code className="rounded bg-white px-1">
                  wallet.transactions.view_all
                </code>{" "}
                untuk melihat riwayat transaksi.
              </div>
            ) : detailError ? (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {detailError}
              </div>
            ) : detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : detailRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada transaksi wallet untuk user ini.
              </p>
            ) : (
              <>
                <WalletTransactionTable rows={detailRows} />
                <NumberedPagination
                  className="mt-2"
                  page={detailPage}
                  lastPage={detailLastPage}
                  total={detailTotal}
                  perPage={10}
                  perPageOptions={[10]}
                  disabled={detailLoading}
                  onPageChange={handleDetailPageChange}
                  onPerPageChange={() => {}}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

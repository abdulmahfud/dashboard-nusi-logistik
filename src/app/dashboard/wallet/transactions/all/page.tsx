"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { AccessDeniedCard } from "@/components/wallet/access-denied-card";
import { WalletTransactionTable } from "@/components/wallet/wallet-transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/context/AuthContext";
import {
  getAllWalletTransactions,
  getWalletPaginatorMeta,
  normalizeWalletTransactions,
} from "@/lib/apiClient";
import type {
  WalletAllTransactionsQuery,
  WalletTransactionItem,
} from "@/types/wallet";
import { AxiosError } from "axios";
import {
  AlertCircle,
  Calendar,
  Filter,
  Globe,
  Loader2,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";

const PER_PAGE_OPTIONS = [10, 20, 30, 40, 50] as const;

const TYPE_OPTIONS = [
  { value: "topup", label: "Top Up" },
  { value: "withdraw", label: "Withdraw" },
  { value: "cod_income", label: "COD Income" },
  { value: "payment", label: "Pembayaran" },
] as const;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
] as const;

const fieldCls = "h-10 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-700";

export default function WalletAllTransactionsPage() {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const canViewAll = hasPermission("wallet.transactions.view_all");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<WalletTransactionItem[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [userId, setUserId] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("__all");
  const [statusFilter, setStatusFilter] = useState<string>("__all");
  const [filterTick, setFilterTick] = useState(0);

  useEffect(() => {
    if (authLoading || !user || !canViewAll) {
      if (!authLoading && user && !canViewAll) setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setForbidden(false);
      setError(null);
      setLoading(true);

      const q: WalletAllTransactionsQuery = {
        page,
        per_page: perPage,
      };
      const uid = parseInt(userId, 10);
      if (Number.isFinite(uid) && uid > 0) q.user_id = uid;
      const amin = parseFloat(amountMin.replace(/\./g, ""));
      if (Number.isFinite(amin)) q.amount_min = amin;
      const amax = parseFloat(amountMax.replace(/\./g, ""));
      if (Number.isFinite(amax)) q.amount_max = amax;
      if (dateFrom) q.date_from = dateFrom;
      if (dateTo) q.date_to = dateTo;
      if (typeFilter && typeFilter !== "__all") {
        q.type = typeFilter as WalletAllTransactionsQuery["type"];
      }
      if (statusFilter && statusFilter !== "__all") {
        q.status = statusFilter as WalletAllTransactionsQuery["status"];
      }

      try {
        const res = await getAllWalletTransactions(q);
        if (cancelled) return;
        const list = normalizeWalletTransactions(res);
        setRows(list);
        const meta = getWalletPaginatorMeta(res);
        if (meta) {
          setLastPage(meta.last_page);
          setTotal(meta.total);
        } else {
          setLastPage(1);
          setTotal(list.length);
        }
      } catch (e) {
        console.error(e);
        if (cancelled) return;
        if (e instanceof AxiosError && e.response?.status === 403) {
          setForbidden(true);
          setRows([]);
          setError(null);
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
    // Hanya refetch saat navigasi/halaman, atau setelah Terapkan/Reset/Muat ulang (filterTick).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nilai filter di atas dibaca dari state terkini saat filterTick berubah
  }, [
    authLoading,
    user,
    canViewAll,
    page,
    perPage,
    filterTick,
  ]);

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
    setUserId("");
    setAmountMin("");
    setAmountMax("");
    setDateFrom("");
    setDateTo("");
    setTypeFilter("__all");
    setStatusFilter("__all");
    setPage(1);
    setPerPage(20);
    setFilterTick((t) => t + 1);
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

  if (!canViewAll) {
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
              description="Hanya akun dengan izin melihat semua transaksi wallet yang dapat membuka halaman ini."
              permissionHint="wallet.transactions.view_all"
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
              { label: "Semua Transaksi" },
            ]}
            icon={Globe}
            title="Semua Transaksi Wallet"
            description="Tampilan administrator untuk seluruh pengguna, bukan riwayat pribadi."
            illustration="/images/wallet2.png"
          />

          {forbidden && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-start gap-3 pt-6 text-sm text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Akses ditolak (403)</p>
                  <p>
                    Anda tidak berhak mengakses daftar transaksi global. Izin
                    yang diperlukan:{" "}
                    <code className="rounded bg-white px-1">
                      wallet.transactions.view_all
                    </code>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <SectionCard
            icon={SlidersHorizontal}
            title="Filter Transaksi"
            description="Saring transaksi berdasarkan kebutuhan Anda."
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="f-user" className={labelCls}>
                    User ID
                  </Label>
                  <Input
                    id="f-user"
                    inputMode="numeric"
                    placeholder="Masukkan User ID"
                    className={fieldCls}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-amin" className={labelCls}>
                    Nominal Min (Rp)
                  </Label>
                  <Input
                    id="f-amin"
                    placeholder="Contoh: 1000"
                    className={fieldCls}
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-amax" className={labelCls}>
                    Nominal Max (Rp)
                  </Label>
                  <Input
                    id="f-amax"
                    placeholder="Contoh: 1000000"
                    className={fieldCls}
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-df" className={labelCls}>
                    Tanggal Dari
                  </Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="f-df"
                      type="date"
                      className={`${fieldCls} pl-9`}
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="f-dt" className={labelCls}>
                    Tanggal Sampai
                  </Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="f-dt"
                      type="date"
                      className={`${fieldCls} pl-9`}
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>Tipe</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className={fieldCls}>
                      <SelectValue placeholder="Semua tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Semua tipe</SelectItem>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className={fieldCls}>
                      <SelectValue placeholder="Semua status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Semua status</SelectItem>
                      {STATUS_OPTIONS.map((o) => (
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
                  onClick={() => setFilterTick((t) => t + 1)}
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
            title="Data Transaksi"
            description={
              total > 0 ? `${total} entri (global)` : "Tidak ada data"
            }
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
                Tidak ada transaksi untuk filter ini.
              </p>
            ) : (
              <>
                <WalletTransactionTable rows={rows} showUserColumn />
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
      </SidebarInset>
    </SidebarProvider>
  );
}

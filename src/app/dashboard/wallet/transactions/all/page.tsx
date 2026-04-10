"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { AccessDeniedCard } from "@/components/wallet/access-denied-card";
import { WalletTransactionTable } from "@/components/wallet/wallet-transaction-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { AlertCircle, Globe, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const PER_PAGE_OPTIONS = [15, 25, 50, 100] as const;

export default function WalletAllTransactionsPage() {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const canViewAll = hasPermission("wallet.transactions.view_all");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(15);
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
          <div>
            <div className="flex items-center gap-2">
              <Globe className="h-7 w-7 text-indigo-600" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Semua transaksi wallet
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Tampilan administrator untuk seluruh pengguna, bukan riwayat pribadi.
            </p>
          </div>

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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter</CardTitle>
              <CardDescription>
                Saring berdasarkan user, tanggal, nominal, tipe, dan status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="f-user">User ID</Label>
                  <Input
                    id="f-user"
                    inputMode="numeric"
                    placeholder="Opsional"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-amin">Nominal min (Rp)</Label>
                  <Input
                    id="f-amin"
                    placeholder="Opsional"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-amax">Nominal max (Rp)</Label>
                  <Input
                    id="f-amax"
                    placeholder="Opsional"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-df">Tanggal dari</Label>
                  <Input
                    id="f-df"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-dt">Tanggal sampai</Label>
                  <Input
                    id="f-dt"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Semua tipe</SelectItem>
                      <SelectItem value="topup">topup</SelectItem>
                      <SelectItem value="withdraw">withdraw</SelectItem>
                      <SelectItem value="cod_income">cod_income</SelectItem>
                      <SelectItem value="payment">payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Semua status</SelectItem>
                      <SelectItem value="pending">pending</SelectItem>
                      <SelectItem value="success">success</SelectItem>
                      <SelectItem value="failed">failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Per halaman</Label>
                  <Select
                    value={String(perPage)}
                    onValueChange={(v) => {
                      setPerPage(Number(v));
                      setPage(1);
                      setFilterTick((t) => t + 1);
                    }}
                  >
                    <SelectTrigger>
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
                  variant="blueGradient"
                >
                  Terapkan filter
                </Button>
                <Button
                  type="button"
                  variant="blueGradientOutline"
                  onClick={() => {
                    setUserId("");
                    setAmountMin("");
                    setAmountMax("");
                    setDateFrom("");
                    setDateTo("");
                    setTypeFilter("__all");
                    setStatusFilter("__all");
                    setPage(1);
                    setPerPage(15);
                    setFilterTick((t) => t + 1);
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="blueGradientOutline"
                  onClick={() => setFilterTick((t) => t + 1)}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Muat ulang
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data transaksi</CardTitle>
              <CardDescription>
                {total > 0 ? `${total} entri (global)` : "Tidak ada data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && !forbidden && (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : forbidden ? null : rows.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  Tidak ada transaksi untuk filter ini.
                </p>
              ) : (
                <>
                  <WalletTransactionTable rows={rows} showUserColumn />
                  {lastPage > 1 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="blueGradientOutline"
                        size="sm"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Sebelumnya
                      </Button>
                      <span className="text-muted-foreground text-sm">
                        Halaman {page} / {lastPage}
                      </span>
                      <Button
                        type="button"
                        variant="blueGradientOutline"
                        size="sm"
                        disabled={page >= lastPage || loading}
                        onClick={() =>
                          setPage((p) => Math.min(lastPage, p + 1))
                        }
                      >
                        Berikutnya
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

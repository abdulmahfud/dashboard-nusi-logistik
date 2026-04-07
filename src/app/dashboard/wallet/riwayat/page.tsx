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
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  getMyWalletTransactions,
  getWalletPaginatorMeta,
  normalizeWalletTransactions,
} from "@/lib/apiClient";
import type { WalletTransactionItem } from "@/types/wallet";
import { AxiosError } from "axios";
import { AlertCircle, History, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function WalletRiwayatPage() {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const canView = hasPermission("wallet.view");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<WalletTransactionItem[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await getMyWalletTransactions({ page });
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
      if (e instanceof AxiosError && e.response?.status === 403) {
        setError(
          "Anda tidak berhak melihat riwayat wallet (izin: wallet.view)."
        );
      } else {
        setError("Gagal memuat riwayat transaksi.");
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canView, page]);

  useEffect(() => {
    if (!authLoading && user && canView) {
      void load();
    }
    if (!authLoading && user && !canView) {
      setLoading(false);
    }
  }, [authLoading, user, canView, load]);

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
              <History className="h-7 w-7 text-blue-600" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Riwayat wallet saya
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Hanya transaksi dompet Anda. Data dari{" "}
              <code className="rounded bg-white px-1 text-xs">
                GET /admin/wallet/transactions
              </code>
            </p>
          </div>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-lg">Transaksi</CardTitle>
                <CardDescription>
                  {total > 0 ? `${total} entri` : "Belum ada data"}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void load()}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Muat ulang
              </Button>
            </CardHeader>
            <CardContent>
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
                <p className="text-muted-foreground py-12 text-center text-sm">
                  Belum ada transaksi dompet.
                </p>
              ) : (
                <>
                  <WalletTransactionTable rows={rows} />
                  {lastPage > 1 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
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
                        variant="outline"
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

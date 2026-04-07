"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { requestWalletTopup } from "@/lib/apiClient";
import { AxiosError } from "axios";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  Globe,
  History,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const MIN_TOPUP = 1000;

function formatIdrDisplay(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "Rp0";
  const n =
    typeof value === "string"
      ? parseFloat(String(value).replace(/,/g, ""))
      : Number(value);
  if (Number.isNaN(n)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function WalletPage() {
  const { user, loading: authLoading, refreshUser, hasPermission } =
    useAuth();
  const canTopup = hasPermission("wallet.topup");
  const canViewOwn = hasPermission("wallet.view");
  const canViewAll = hasPermission("wallet.transactions.view_all");

  const [amountRaw, setAmountRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(amountRaw, 10);
    if (!Number.isFinite(amount) || amount < MIN_TOPUP) {
      toast.error(`Minimal top-up Rp ${MIN_TOPUP.toLocaleString("id-ID")}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestWalletTopup(amount);
      if (!res.success || !res.data?.invoice_url) {
        toast.error(res.message || "Gagal membuat invoice pembayaran");
        return;
      }
      toast.info("Mengarahkan ke halaman pembayaran Xendit…");
      window.location.href = res.data.invoice_url;
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const msg =
          (err.response?.data as { message?: string })?.message ||
          err.message;
        toast.error(
          status === 403
            ? "Anda tidak punya izin top-up saldo (wallet.topup)."
            : msg || "Gagal memproses top-up"
        );
      } else {
        toast.error("Gagal memproses top-up");
      }
    } finally {
      setSubmitting(false);
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

  if (!user) {
    return null;
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dompet & saldo
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Top-up melalui pembayaran Xendit. Saldo bertambah setelah
              pembayaran dikonfirmasi sistem (webhook), bukan saat tab ditutup.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-blue-100 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Saldo saat ini</CardTitle>
                    <CardDescription>
                      Dari data akun (GET /admin/me)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums text-slate-900">
                  {formatIdrDisplay(user?.balance)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => void refreshUser()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh saldo
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-emerald-100 p-2">
                    <ArrowDownToLine className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Top-up saldo</CardTitle>
                    <CardDescription>
                      Minimum Rp {MIN_TOPUP.toLocaleString("id-ID")} — Anda akan
                      diarahkan ke halaman pembayaran Xendit.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {canTopup ? (
                  <form onSubmit={handleTopup} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="topup-amount"
                        className="text-sm font-medium"
                      >
                        Nominal (Rp)
                      </label>
                      <CurrencyInput
                        id="topup-amount"
                        value={amountRaw}
                        onChange={setAmountRaw}
                        placeholder="10000"
                      />
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Anda akan diarahkan ke halaman pembayaran Xendit. Saldo
                      belum bertambah sebelum pembayaran selesai diverifikasi.
                    </p>
                    <Button
                      type="submit"
                      disabled={submitting || !amountRaw}
                      className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses…
                        </>
                      ) : (
                        "Lanjutkan pembayaran"
                      )}
                    </Button>
                  </form>
                ) : (
                  <div
                    className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                    role="status"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>
                      Akun Anda belum memiliki izin{" "}
                      <code className="rounded bg-white px-1">wallet.topup</code>
                      . Hubungi admin untuk mengaktifkan top-up saldo.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">Riwayat wallet saya</CardTitle>
                </div>
                <CardDescription>
                  Transaksi dompet Anda sendiri (izin{" "}
                  <code className="text-xs">wallet.view</code>).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canViewOwn ? (
                  <Button asChild variant="secondary" className="w-full gap-2 sm:w-auto">
                    <Link href="/dashboard/wallet/riwayat">
                      Buka riwayat
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Anda tidak memiliki akses riwayat pribadi (wallet.view).
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/40">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-700" />
                  <CardTitle className="text-base">
                    Semua transaksi wallet
                  </CardTitle>
                </div>
                <CardDescription>
                  Tampilan admin — seluruh pengguna (
                  <code className="text-xs">wallet.transactions.view_all</code>
                  ).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canViewAll ? (
                  <Button
                    asChild
                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
                  >
                    <Link href="/dashboard/wallet/transactions/all">
                      Buka daftar global
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Menu ini hanya untuk peran dengan izin melihat semua
                    transaksi wallet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

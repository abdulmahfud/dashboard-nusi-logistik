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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  getBankAccounts,
  getWalletBalance,
  requestWalletTopup,
  requestWalletWithdraw,
} from "@/lib/apiClient";
import { AxiosError } from "axios";
import {
  AlertCircle,
  ArrowDownToLine,
  History,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

/** Saldo untuk perbandingan: bilangan bulat rupiah (floor). */
function balanceToIntFloor(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  const n =
    typeof value === "string"
      ? parseFloat(String(value).replace(/,/g, ""))
      : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export default function WalletPage() {
  const { user, loading: authLoading, hasPermission } =
    useAuth();
  const canTopup = hasPermission("wallet.topup");
  const canViewOwn = hasPermission("wallet.view");
  const canWithdraw = hasPermission("wallet.withdraw");

  const [amountRaw, setAmountRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState<string | number | undefined>(undefined);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmountRaw, setWithdrawAmountRaw] = useState("");
  const [withdrawBankId, setWithdrawBankId] = useState<string>("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [approvedBankIds, setApprovedBankIds] = useState<
    { id: number; label: string }[]
  >([]);

  const loadBalance = async () => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const res = await getWalletBalance();
      setBalance(res.data?.balance);
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = (err.response?.data as { message?: string })?.message;
        setBalanceError(msg || "Gagal memuat saldo wallet.");
      } else {
        setBalanceError("Gagal memuat saldo wallet.");
      }
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      void loadBalance();
    }
  }, [authLoading, user]);

  const loadApprovedBankOptions = async () => {
    setBankAccountsLoading(true);
    try {
      const res = await getBankAccounts();
      const list = (res.data ?? []).filter((a) => a.status === "approved");
      setApprovedBankIds(
        list.map((a) => ({
          id: a.id,
          label: `${a.bank_name} · ${a.account_number} (${a.account_name})`,
        }))
      );
      setWithdrawBankId((cur) => {
        if (cur && list.some((a) => String(a.id) === cur)) return cur;
        return list[0] ? String(list[0].id) : "";
      });
    } catch {
      setApprovedBankIds([]);
      setWithdrawBankId("");
      toast.error("Gagal memuat daftar rekening. Pastikan rekening sudah disetujui.");
    } finally {
      setBankAccountsLoading(false);
    }
  };

  useEffect(() => {
    if (withdrawOpen && canWithdraw) {
      void loadApprovedBankOptions();
    }
  }, [withdrawOpen, canWithdraw]);

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

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const maxRupiah = balanceToIntFloor(balance);
    const raw = withdrawAmountRaw.replace(/\D/g, "");
    const amount = parseInt(raw, 10);

    if (!Number.isFinite(amount) || amount < 1) {
      toast.error("Masukkan nominal penarikan berupa bilangan bulat lebih dari nol.");
      return;
    }
    if (amount > maxRupiah) {
      toast.error("Nominal tidak boleh melebihi saldo saat ini.");
      return;
    }
    const bankId = parseInt(withdrawBankId, 10);
    if (!Number.isFinite(bankId) || bankId < 1) {
      toast.error("Pilih rekening tujuan penarikan.");
      return;
    }

    setWithdrawSubmitting(true);
    try {
      const res = await requestWalletWithdraw({
        amount,
        bank_account_id: bankId,
        description: withdrawNote.trim() || undefined,
      });
      if (!res.success) {
        toast.error(res.message || "Gagal mengajukan penarikan.");
        return;
      }
      toast.success(res.message || "Pengajuan penarikan terkirim.");
      setWithdrawOpen(false);
      setWithdrawAmountRaw("");
      setWithdrawNote("");
      await loadBalance();
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const msg =
          (err.response?.data as { message?: string })?.message ||
          err.message;
        toast.error(
          status === 403
            ? "Anda tidak punya izin untuk menarik saldo."
            : msg || "Gagal mengajukan penarikan."
        );
      } else {
        toast.error("Gagal mengajukan penarikan.");
      }
    } finally {
      setWithdrawSubmitting(false);
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
            Saldo bertambah setelah
            pembayaran dikonfirmasi sistem.
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="border-blue-100 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Saldo saat ini</CardTitle>
                    <CardDescription>
                      Menampilkan saldo aktif terbaru dari akun Anda.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-3xl font-bold tabular-nums text-slate-900">
                  {balanceLoading
                    ? "Memuat saldo..."
                    : formatIdrDisplay(balance)}
                </p>
                {balanceError && (
                  <p className="mt-2 text-sm text-red-600">{balanceError}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => void loadBalance()}
                    disabled={balanceLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`}
                    />
                    Refresh saldo
                  </Button>
                  {canWithdraw && (
                    <Button
                      type="button"
                      size="sm"
                      variant="blueGradientStrong"
                      onClick={() => setWithdrawOpen(true)}
                      disabled={balanceLoading}
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      Tarik saldo
                    </Button>
                  )}
                  {canViewOwn && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <Link href="/dashboard/wallet/riwayat">
                        <History className="h-4 w-4" />
                        Riwayat dompet
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-full bg-emerald-100 p-2">
                      <ArrowDownToLine className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Top-up saldo
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Minimum Rp {MIN_TOPUP.toLocaleString("id-ID")} — Anda akan
                        diarahkan ke halaman pembayaran Xendit.
                      </p>
                    </div>
                  </div>
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
                        Anda akan diarahkan ke halaman pembayaran. Saldo
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog
          open={withdrawOpen}
          onOpenChange={(open) => {
            setWithdrawOpen(open);
            if (!open) {
              setWithdrawAmountRaw("");
              setWithdrawNote("");
            }
          }}
        >
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
            <DialogHeader className="shrink-0 space-y-2 p-6 pb-2 text-left">
              <DialogTitle>Tarik saldo</DialogTitle>
              <DialogDescription>
                Nominal wajib bilangan bulat (rupiah), tidak melebihi saldo, dan
                tidak boleh negatif. Pilih rekening bank yang sudah disetujui.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleWithdrawSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
                <div className="space-y-4 pb-2">
                  <p className="text-muted-foreground text-sm">
                    Saldo tersedia:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatIdrDisplay(balance)}
                    </span>
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-bank">Rekening tujuan</Label>
                    {bankAccountsLoading ? (
                      <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat rekening…
                      </p>
                    ) : approvedBankIds.length === 0 ? (
                      <p
                        className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                        role="status"
                      >
                        Belum ada rekening disetujui. Tambahkan dan verifikasi
                        rekening di menu Rekening terlebih dahulu.
                      </p>
                    ) : (
                      <Select
                        value={withdrawBankId}
                        onValueChange={setWithdrawBankId}
                      >
                        <SelectTrigger id="withdraw-bank" className="w-full">
                          <SelectValue placeholder="Pilih rekening" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[min(280px,50vh)] overflow-y-auto">
                          {approvedBankIds.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Nominal tarik (Rp)</Label>
                    <CurrencyInput
                      id="withdraw-amount"
                      value={withdrawAmountRaw}
                      onChange={setWithdrawAmountRaw}
                      placeholder="0"
                    />
                    <p className="text-muted-foreground text-xs">
                      Hanya angka bulat; maksimal sesuai saldo tersedia.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-note">Keterangan (opsional)</Label>
                    <Textarea
                      id="withdraw-note"
                      value={withdrawNote}
                      onChange={(e) => setWithdrawNote(e.target.value)}
                      placeholder="Contoh: pencairan saldo"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="shrink-0 gap-2 border-t bg-background p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWithdrawOpen(false)}
                  disabled={withdrawSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={
                    withdrawSubmitting ||
                    bankAccountsLoading ||
                    approvedBankIds.length === 0 ||
                    !withdrawAmountRaw
                  }
                >
                  {withdrawSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim…
                    </>
                  ) : (
                    "Ajukan Penarikan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

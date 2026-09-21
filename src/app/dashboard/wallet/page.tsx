"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { WalletRecentTransactions } from "@/components/wallet/wallet-recent-transactions";
import { Button } from "@/components/ui/button";
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
  getMyWalletTransactions,
  getWalletBalance,
  getWalletSummary,
  normalizeWalletTransactions,
  requestWalletTopup,
  requestWalletWithdraw,
} from "@/lib/apiClient";
import { AxiosError } from "axios";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Clock,
  TrendingDown,
  History,
  Info,
  Loader2,
  RefreshCw,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDateTimeId } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import type { WalletSummaryData, WalletTransactionItem } from "@/types/wallet";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MIN_TOPUP = 1000;
/** Jumlah transaksi terakhir yang ditampilkan di halaman Dompet. */
const RECENT_LIMIT = 5;

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

/** "2026-07" -> "Juli 2026" */
function summaryPeriodLabel(month: string | undefined): string | undefined {
  const m = /^(\d{4})-(\d{2})$/.exec(month ?? "");
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString(
    "id-ID",
    { month: "long", year: "numeric" }
  );
}

function summaryValue(
  summary: WalletSummaryData | null,
  loading: boolean,
  error: boolean,
  pick: (s: WalletSummaryData) => string
): string {
  if (loading && !summary) return "…";
  if (!summary) return error ? "–" : "…";
  return pick(summary);
}

function SummaryRow({
  icon: Icon,
  tone,
  label,
  value,
  valueClass,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <dt className="flex-1 text-sm text-slate-600">{label}</dt>
      <dd
        className={`text-right text-sm font-semibold tabular-nums ${valueClass ?? "text-slate-900"}`}
      >
        {value}
      </dd>
    </div>
  );
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

  const [summary, setSummary] = useState<WalletSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  const [recent, setRecent] = useState<WalletTransactionItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

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

  const loadSummary = async () => {
    if (!canViewOwn) return;
    setSummaryLoading(true);
    setSummaryError(false);
    try {
      const res = await getWalletSummary();
      setSummary(res.data ?? null);
    } catch {
      setSummary(null);
      setSummaryError(true);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadRecent = async () => {
    if (!canViewOwn) return;
    setRecentLoading(true);
    setRecentError(null);
    try {
      const res = await getMyWalletTransactions({
        page: 1,
        per_page: RECENT_LIMIT,
      });
      setRecent(normalizeWalletTransactions(res).slice(0, RECENT_LIMIT));
    } catch (err) {
      setRecentError(
        err instanceof AxiosError && err.response?.status === 403
          ? "Anda tidak berhak melihat riwayat wallet (izin: wallet.view)."
          : "Gagal memuat transaksi terakhir."
      );
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      void loadBalance();
      void loadRecent();
      void loadSummary();
    }
  }, [authLoading, user, canViewOwn]);

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
      void loadRecent();
      void loadSummary();
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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Dompet" },
            ]}
            iconSrc="/images/wallet3.png"
            title="Dompet & Saldo"
            description="Kelola saldo Anda dengan mudah dan aman."
          />

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Saldo saat ini
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Saldo aktif terbaru dari akun Anda.
                      </p>
                    </div>
                    <p className="text-3xl font-bold tabular-nums text-slate-900 md:text-4xl">
                      {balanceLoading
                        ? "Memuat saldo..."
                        : formatIdrDisplay(balance)}
                    </p>
                    {balanceError && (
                      <p className="text-sm text-red-600">{balanceError}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => {
                          void loadBalance();
                          void loadRecent();
                          void loadSummary();
                        }}
                        disabled={balanceLoading}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`}
                          aria-hidden
                        />
                        Refresh Saldo
                      </Button>
                      {canWithdraw && (
                        <Button
                          type="button"
                          className="h-10 gap-2 bg-blue-600 text-white hover:bg-blue-700"
                          onClick={() => setWithdrawOpen(true)}
                          disabled={balanceLoading}
                        >
                          <ArrowDownToLine className="h-4 w-4" aria-hidden />
                          Tarik Saldo
                        </Button>
                      )}
                      {canViewOwn && (
                        <Button
                          asChild
                          variant="outline"
                          className="h-10 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Link href="/dashboard/wallet/riwayat">
                            <History className="h-4 w-4" aria-hidden />
                            Riwayat Dompet
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  <Image
                    src="/images/wallet2.png"
                    alt=""
                    width={274}
                    height={156}
                    className="pointer-events-none hidden h-auto w-[200px] shrink-0 select-none md:block"
                  />
                </div>
              </section>

              <SectionCard
                icon={ArrowUpFromLine}
                iconClassName="bg-emerald-50 text-emerald-600"
                title="Top-up Saldo"
                description={`Minimum Rp ${MIN_TOPUP.toLocaleString("id-ID")} — Anda akan diarahkan ke halaman pembayaran Xendit.`}
              >
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
                  {canTopup ? (
                    <form onSubmit={handleTopup} className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="topup-amount"
                          className="text-sm font-medium text-slate-800"
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
                      <p className="text-xs leading-relaxed text-slate-500">
                        Anda akan diarahkan ke halaman pembayaran. Saldo belum
                        bertambah sebelum pembayaran selesai diverifikasi.
                      </p>
                      <Button
                        type="submit"
                        disabled={submitting || !amountRaw}
                        className="h-10 gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Memproses…
                          </>
                        ) : (
                          <>
                            Lanjutkan Pembayaran
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </>
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
                        <code className="rounded bg-white px-1">
                          wallet.topup
                        </code>
                        . Hubungi admin untuk mengaktifkan top-up saldo.
                      </p>
                    </div>
                  )}

                  <aside className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm">
                    <p className="flex items-center gap-2 font-semibold text-emerald-700">
                      <Info className="h-4 w-4" aria-hidden />
                      Informasi
                    </p>
                    <p className="mt-2 leading-relaxed text-slate-600">
                      Saldo digunakan untuk semua transaksi pengiriman dan
                      layanan tambahan di BhisaKirim.
                    </p>
                  </aside>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              icon={Wallet}
              title="Ringkasan Dompet"
              description={summaryPeriodLabel(summary?.period.month)}
            >
              <dl className="divide-y divide-slate-100">
                <SummaryRow
                  icon={Wallet}
                  tone="bg-blue-50 text-blue-600"
                  label="Total Saldo"
                  value={balanceLoading ? "…" : formatIdrDisplay(balance)}
                />
                {canViewOwn && (
                  <>
                    <SummaryRow
                      icon={ArrowUpFromLine}
                      tone="bg-emerald-50 text-emerald-600"
                      label="Top-up Bulan Ini"
                      value={summaryValue(summary, summaryLoading, summaryError, (s) =>
                        formatRupiah(s.total_topup)
                      )}
                      valueClass="text-emerald-600"
                    />
                    <SummaryRow
                      icon={TrendingDown}
                      tone="bg-rose-50 text-rose-600"
                      label="Penggunaan Bulan Ini"
                      value={summaryValue(summary, summaryLoading, summaryError, (s) =>
                        `-${formatRupiah(s.total_usage)}`
                      )}
                      valueClass="text-rose-600"
                    />
                    <SummaryRow
                      icon={Clock}
                      tone="bg-violet-50 text-violet-600"
                      label="Transaksi Terakhir"
                      value={summaryValue(summary, summaryLoading, summaryError, (s) => {
                        const dt = formatDateTimeId(s.last_transaction_at);
                        return dt ? `${dt.date}, ${dt.time.slice(0, 5)}` : "–";
                      })}
                    />
                  </>
                )}
              </dl>
            </SectionCard>
          </div>

          {canViewOwn && (
            <WalletRecentTransactions
              rows={recent}
              loading={recentLoading}
              error={recentError}
              viewAllHref="/dashboard/wallet/riwayat"
            />
          )}
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
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl border-slate-100 p-0 sm:max-w-lg">
            <DialogHeader className="shrink-0 space-y-0 p-5 pb-4 text-left md:p-6 md:pb-4">
              <div className="flex items-center gap-3 pr-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ArrowDownToLine className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <DialogTitle className="text-lg font-semibold leading-tight text-slate-900">
                    Tarik Saldo
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-sm text-slate-500">
                    Pilih rekening bank yang sudah disetujui dan isi nominal
                    penarikan.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form
              onSubmit={handleWithdrawSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 md:px-6">
                <div className="space-y-5">
                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                      <Wallet className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Saldo tersedia</p>
                      <p className="truncate text-xl font-bold tabular-nums text-slate-900">
                        {formatIdrDisplay(balance)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="withdraw-bank"
                      className="text-sm font-medium text-slate-800"
                    >
                      Rekening tujuan
                    </Label>
                    {bankAccountsLoading ? (
                      <p className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat rekening…
                      </p>
                    ) : approvedBankIds.length === 0 ? (
                      <div
                        className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                        role="status"
                      >
                        <AlertCircle
                          className="mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden
                        />
                        <p>
                          Belum ada rekening disetujui. Tambahkan dan verifikasi
                          rekening di menu{" "}
                          <Link
                            href="/dashboard/akun/rekening"
                            className="font-medium underline underline-offset-2"
                          >
                            Rekening
                          </Link>{" "}
                          terlebih dahulu.
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={withdrawBankId}
                        onValueChange={setWithdrawBankId}
                      >
                        <SelectTrigger
                          id="withdraw-bank"
                          className="h-11 w-full rounded-lg border-slate-200 bg-white"
                        >
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
                    <Label
                      htmlFor="withdraw-amount"
                      className="text-sm font-medium text-slate-800"
                    >
                      Nominal tarik (Rp)
                    </Label>
                    <CurrencyInput
                      id="withdraw-amount"
                      value={withdrawAmountRaw}
                      onChange={setWithdrawAmountRaw}
                      placeholder="0"
                      className="h-11 rounded-lg border-slate-200 bg-white"
                    />
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Hanya angka bulat; maksimal sesuai saldo tersedia.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="withdraw-note"
                      className="text-sm font-medium text-slate-800"
                    >
                      Keterangan{" "}
                      <span className="font-normal text-slate-400">
                        (opsional)
                      </span>
                    </Label>
                    <Textarea
                      id="withdraw-note"
                      value={withdrawNote}
                      onChange={(e) => setWithdrawNote(e.target.value)}
                      placeholder="Contoh: pencairan saldo"
                      rows={3}
                      className="resize-none rounded-lg border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 bg-slate-50/60 p-4 md:px-6">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg border-slate-200"
                  onClick={() => setWithdrawOpen(false)}
                  disabled={withdrawSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  disabled={
                    withdrawSubmitting ||
                    bankAccountsLoading ||
                    approvedBankIds.length === 0 ||
                    !withdrawAmountRaw
                  }
                >
                  {withdrawSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengirim…
                    </>
                  ) : (
                    <>
                      Ajukan Penarikan
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
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

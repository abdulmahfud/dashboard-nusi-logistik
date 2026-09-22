"use client";

import { ArrowDownToLine, Landmark, Wallet } from "lucide-react";

import Link from "next/link";
import { Button } from "./ui/button";
import { getWalletBalance, getWalletSummary } from "@/lib/apiClient";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";

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

export function SectionCardsBalance() {
  const [balance, setBalance] = useState<string | number | undefined>(undefined);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [totalWithdraw, setTotalWithdraw] = useState<string | number | undefined>(
    undefined
  );
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const loadBalance = async () => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const res = await getWalletBalance();
      setBalance(res.data?.balance);
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = (err.response?.data as { message?: string })?.message;
        setBalanceError(msg || "Gagal memuat saldo aktif.");
      } else {
        setBalanceError("Gagal memuat saldo aktif.");
      }
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadWithdrawSummary = async () => {
    setWithdrawLoading(true);
    try {
      const res = await getWalletSummary();
      setTotalWithdraw(res.data?.total_withdraw);
    } catch (err) {
      console.error("Failed to fetch withdraw summary:", err);
    } finally {
      setWithdrawLoading(false);
    }
  };

  useEffect(() => {
    void loadBalance();
    void loadWithdrawSummary();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Total Saldo Aktif */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600">
            <Wallet className="h-7 w-7" aria-hidden />
          </span>
          <p className="text-sm font-medium text-slate-600">
            Total Saldo Aktif
          </p>
        </div>
        <p className="mt-3 text-2xl font-bold text-slate-900">
          {balanceLoading ? "Memuat..." : formatIdrDisplay(balance)}
        </p>
        {balanceError ? (
          <p className="mt-1 text-sm text-red-600">{balanceError}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">Saldo tersedia saat ini</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700"
            asChild
          >
            <Link href="/dashboard/wallet">Tarik Saldo</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
            asChild
          >
            <Link href="/dashboard/wallet">Dompet &amp; Top-up</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg border-slate-200"
            onClick={() => void loadBalance()}
            disabled={balanceLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Penarikan Saldo */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-orange-50 text-orange-500">
            <ArrowDownToLine className="h-7 w-7" aria-hidden />
          </span>
          <p className="text-sm font-medium text-slate-600">Penarikan Saldo</p>
        </div>
        <p className="mt-3 text-2xl font-bold text-slate-900">
          {withdrawLoading ? "Memuat..." : formatIdrDisplay(totalWithdraw)}
        </p>
        <p className="mt-1 text-xs text-slate-400">Total penarikan bulan ini</p>
      </div>

      {/* Saldo Estimasi */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-violet-50 text-violet-600">
            <Landmark className="h-7 w-7" aria-hidden />
          </span>
          <p className="text-sm font-medium text-slate-600">Saldo Estimasi</p>
        </div>
        <p className="mt-3 text-2xl font-bold text-slate-900">Rp0</p>
        <p className="mt-1 text-xs text-slate-400">Saldo yang sedang diproses</p>
      </div>
    </div>
  );
}

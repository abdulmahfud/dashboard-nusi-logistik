 "use client";

import { Wallet, Info, CreditCard, History } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Image from "next/image";
import Link from "next/link";
import { DatePickerWithRange } from "./date-picker-with-range";
import { Button } from "./ui/button";
import { getWalletBalance } from "@/lib/apiClient";
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

  useEffect(() => {
    void loadBalance();
  }, []);

  return (
    <>
      <Card className="@container/card px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 relative">
        {/* Date Picker di pojok kanan atas */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-20">
          <DatePickerWithRange />
        </div>
        
        {/* Header Section */}
        <div className="flex items-center py-2 sm:py-3 lg:py-4 pt-12 sm:pt-14 lg:pt-16 pl-2 sm:pl-3 lg:pl-5">
          <Image
            src="/images/wallet.png"
            alt="delivery"
            width={40}
            height={40}
            priority
            className="sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-blue-100 p-1.5 sm:p-2"
          />
          <CardTitle className="pl-2 sm:pl-3 text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold tabular-nums">
            Saldo Akun
          </CardTitle>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Saldo Aktif Card */}
          <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-green-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Total Saldo Aktif
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="text-2xl font-bold text-gray-900">
                  {balanceLoading ? "Memuat saldo..." : formatIdrDisplay(balance)}
                </div>
                {balanceError && (
                  <p className="text-sm text-red-600">{balanceError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
                    <Link href="/dashboard/wallet">Tarik Saldo</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    asChild
                  >
                    <Link href="/dashboard/wallet">Dompet &amp; top-up</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void loadBalance()}
                    disabled={balanceLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo Estimasi Card */}
          <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Saldo Estimasi
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="text-2xl font-bold text-gray-900">Rp0</div>
                <div className="text-sm text-gray-500">
                  Saldo yang sedang diproses
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Belum di Kurir Card */}
          <Card className="bg-white shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <History className="w-4 h-4 text-orange-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Belum di Kurir
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="text-2xl font-bold text-gray-900">Rp0</div>
                <div className="text-sm text-gray-500">
                  Saldo yang menunggu pengiriman
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>
    </>
  );
}
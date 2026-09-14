"use client";

import { CreditCard, Wallet, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserData } from "@/types/api";

function formatIdr(value: string | number | null | undefined): string {
  if (value === undefined || value === null || value === "") return "Rp0";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

/**
 * Info limit kredit untuk akun corporate (kerja sama/postpaid).
 * Lihat docs/be-fe/update-deteksi-tipe-akun-me.md — data diambil langsung
 * dari blok `credit` pada GET /admin/me, tidak perlu request tambahan.
 */
export function SectionCardsCredit({ user }: { user: UserData }) {
  if (user.account_type !== "corporate" || !user.credit) return null;

  const creditLimit = Number(user.credit.credit_limit) || 0;
  const outstanding = Number(user.credit.outstanding_balance) || 0;
  const maxOutstanding =
    user.credit.max_outstanding != null
      ? Number(user.credit.max_outstanding)
      : creditLimit;
  const remaining = Math.max(maxOutstanding - outstanding, 0);
  const isNearLimit = maxOutstanding > 0 && outstanding / maxOutstanding >= 0.9;

  return (
    <Card className="@container/card px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex items-center py-2 sm:py-3 lg:py-4 pl-2 sm:pl-3 lg:pl-5">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-blue-100">
          <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
        </div>
        <CardTitle className="pl-2 sm:pl-3 text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold tabular-nums">
          Limit Kredit Kerja Sama
        </CardTitle>
      </div>

      {!user.credit.kerja_sama_is_active && (
        <div className="mx-2 mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Akun kerja sama sedang nonaktif — order baru tidak bisa dibuat lewat
          limit kredit sampai diaktifkan kembali oleh admin.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Limit Kredit
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">
              {formatIdr(creditLimit)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Outstanding Saat Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">
              {formatIdr(outstanding)}
            </div>
            {isNearLimit && (
              <p className="mt-1 text-xs text-red-600">
                Mendekati/melebihi batas maksimum.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium text-gray-700">
                Sisa Limit Tersedia
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">
              {formatIdr(remaining)}
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}

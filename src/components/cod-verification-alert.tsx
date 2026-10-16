"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getBankAccounts } from "@/lib/apiClient";
import type { BankAccount } from "@/types/bankAccount";
import type { UserData } from "@/types/api";

/**
 * Warning COD terkunci untuk akun personal yang belum upload/belum disetujui
 * KTP + rekening bank. Pindah dari halaman Kirim Paket Reguler ke Beranda
 * (dashboard) agar tampil begitu login, bukan menunggu user ke halaman kirim
 * paket. Corporate tidak kena aturan ini. Lihat
 * docs/be-fe/update-cod-butuh-rekening-bank-personal.md
 */
export function CodVerificationAlert({ user }: { user: UserData }) {
  const isPersonalAccount = user.account_type === "personal";
  const codEligible = !isPersonalAccount || user.cod_eligible !== false;

  const [myBankAccounts, setMyBankAccounts] = useState<BankAccount[] | null>(
    null
  );
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

  useEffect(() => {
    if (!isPersonalAccount || codEligible) return;
    setLoadingBankAccounts(true);
    getBankAccounts()
      .then((res) => setMyBankAccounts(res.data))
      .catch(() => setMyBankAccounts([]))
      .finally(() => setLoadingBankAccounts(false));
  }, [isPersonalAccount, codEligible]);

  if (!isPersonalAccount || codEligible) return null;

  const reason = (): string => {
    if (loadingBankAccounts) return "Memeriksa status rekening bank…";
    if (!myBankAccounts || myBankAccounts.length === 0) {
      return "Belum ada rekening bank terdaftar.";
    }
    if (myBankAccounts.some((b) => b.status === "pending")) {
      return "Rekening bank Anda sedang menunggu persetujuan admin.";
    }
    if (
      myBankAccounts.some(
        (b) => b.status === "approved" && b.deletion_requested_at
      )
    ) {
      return "Rekening bank Anda sedang menunggu proses penghapusan.";
    }
    return "Rekening bank Anda ditolak admin. Perbaiki data dan ajukan ulang.";
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
        aria-hidden
      />
      <div>
        <p>
          Fitur COD belum bisa di gunakan — {reason()} Upload ktp dan
          rekening bank, Fitur COD bisa di gunakan setelah ktp dan rekening
          bank di setujui.
        </p>
        <Link
          href="/dashboard/akun/rekening"
          className="mt-1 inline-flex items-center font-medium text-amber-900 underline hover:text-amber-950"
        >
          Kelola rekening bank →
        </Link>
      </div>
    </div>
  );
}

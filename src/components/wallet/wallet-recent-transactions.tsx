"use client";

import Link from "next/link";
import { ArrowRight, History, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionCard } from "@/components/redesign/section-card";
import { StatusBadge } from "@/components/redesign/status-badge";
import {
  TX_AMOUNT_CLASS,
  formatSignedRupiah,
  getTxTypeMeta,
} from "@/components/redesign/tx-type";
import { formatRupiah } from "@/lib/currency";
import { formatDateTimeId } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { WalletTransactionItem } from "@/types/wallet";

const TYPE_LABEL: Record<string, string> = {
  topup: "Top-up",
  payment: "Pembayaran",
  withdraw: "Penarikan",
  cod_income: "COD Masuk",
};

const TYPE_PILL_CLASS = {
  in: "bg-emerald-50 text-emerald-700",
  out: "bg-rose-50 text-rose-700",
  neutral: "bg-slate-100 text-slate-600",
} as const;

const STATUS_LABEL: Record<string, string> = {
  success: "Berhasil",
  paid: "Berhasil",
  approved: "Berhasil",
  completed: "Berhasil",
  settled: "Berhasil",
  pending: "Menunggu",
  waiting: "Menunggu",
  processing: "Diproses",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  canceled: "Dibatalkan",
};

const headCls =
  "h-11 text-[11px] font-semibold uppercase tracking-wide text-slate-500";

type Props = {
  rows: WalletTransactionItem[];
  loading: boolean;
  error: string | null;
  /** Tujuan tombol "Lihat Semua". */
  viewAllHref: string;
};

/** Ringkasan transaksi wallet terbaru (mis. 5 terakhir) untuk halaman Dompet. */
export function WalletRecentTransactions({
  rows,
  loading,
  error,
  viewAllHref,
}: Props) {
  return (
    <SectionCard
      icon={History}
      title="Transaksi Terakhir"
      action={
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        >
          <Link href={viewAllHref}>
            Lihat Semua
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Memuat transaksi…
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Belum ada transaksi.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className={headCls}>Tanggal</TableHead>
                <TableHead className={headCls}>Jenis Transaksi</TableHead>
                <TableHead className={headCls}>Deskripsi</TableHead>
                <TableHead className={cn(headCls, "text-center")}>
                  Status
                </TableHead>
                <TableHead className={cn(headCls, "text-right")}>
                  Nominal
                </TableHead>
                <TableHead className={cn(headCls, "text-right")}>
                  Saldo Akhir
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => {
                const { icon: TypeIcon, tone } = getTxTypeMeta(row.type);
                const typeKey =
                  typeof row.type === "string" ? row.type.toLowerCase() : "";
                const typeLabel =
                  TYPE_LABEL[typeKey] ?? (row.type ? String(row.type) : "—");
                const statusKey =
                  typeof row.status === "string"
                    ? row.status.trim().toLowerCase()
                    : "";
                const dt = formatDateTimeId(row.created_at);

                return (
                  <TableRow
                    key={row.id ?? idx}
                    className="border-slate-100 hover:bg-slate-50/60"
                  >
                    <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                      {dt ? `${dt.date}, ${dt.time.slice(0, 5)}` : "—"}
                    </TableCell>
                    <TableCell className="py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          TYPE_PILL_CLASS[tone]
                        )}
                      >
                        <TypeIcon className="h-3.5 w-3.5" aria-hidden />
                        {typeLabel}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-[220px] max-w-[320px] py-4 text-sm text-slate-700">
                      <span className="line-clamp-2">
                        {row.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <StatusBadge
                        status={row.status}
                        label={STATUS_LABEL[statusKey]}
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "whitespace-nowrap py-4 text-right text-sm font-semibold tabular-nums",
                        TX_AMOUNT_CLASS[tone]
                      )}
                    >
                      {formatSignedRupiah(row.amount ?? 0, tone)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-4 text-right text-sm font-semibold tabular-nums text-slate-900">
                      {row.balance_after != null && row.balance_after !== ""
                        ? formatRupiah(row.balance_after)
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </SectionCard>
  );
}

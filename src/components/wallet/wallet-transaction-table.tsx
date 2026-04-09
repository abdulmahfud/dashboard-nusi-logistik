"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/currency";
import { formatDateIdLong } from "@/lib/date";
import type { WalletTransactionItem } from "@/types/wallet";

export function formatTxCell(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "number")
    return new Intl.NumberFormat("id-ID").format(v);
  return String(v);
}

function formatTxDate(v: unknown): string {
  // API biasanya mengirim string ISO pada `created_at`
  if (typeof v === "string" || typeof v === "number" || v instanceof Date) {
    return formatDateIdLong(v as string | number | Date);
  }
  return "—";
}

type Props = {
  rows: WalletTransactionItem[];
  showUserColumn?: boolean;
};

export function WalletTransactionTable({
  rows,
  showUserColumn = false,
}: Props) {
  return (
    <div className="max-h-[min(560px,70vh)] overflow-x-auto overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showUserColumn && <TableHead>Pengguna</TableHead>}
            <TableHead>Tanggal</TableHead>
            <TableHead>Jenis / Keterangan</TableHead>
            <TableHead className="text-right">Nominal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Referensi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={row.id ?? idx}>
              {showUserColumn && (
                <TableCell className="max-w-[180px] text-sm">
                  {row.user?.name
                    ? `${row.user.name}${row.user.email ? ` (${row.user.email})` : ""}`
                    : row.user?.id != null
                      ? `User #${row.user.id}`
                      : "—"}
                </TableCell>
              )}
              <TableCell className="whitespace-nowrap text-sm">
                {formatTxDate(row.created_at)}
              </TableCell>
              <TableCell className="max-w-[220px] text-sm">
                {formatTxCell(row.description ?? row.type ?? "—")}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {formatRupiah(
                  typeof row.amount === "string" || typeof row.amount === "number"
                    ? row.amount
                    : 0
                )}
              </TableCell>
              <TableCell className="text-sm">
                {formatTxCell(row.status)}
              </TableCell>
              <TableCell className="max-w-[160px] break-all text-xs">
                {row.reference_no
                  ? String(row.reference_no)
                  : row.payment?.reference_no
                    ? String(row.payment.reference_no)
                    : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

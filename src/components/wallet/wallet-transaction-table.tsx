"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/redesign/status-badge";
import {
  TX_AMOUNT_CLASS,
  TxIconCircle,
  formatSignedRupiah,
  getTxTypeMeta,
} from "@/components/redesign/tx-type";
import { formatDateTimeId } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { WalletTransactionItem } from "@/types/wallet";

type Props = {
  rows: WalletTransactionItem[];
  showUserColumn?: boolean;
};

const headCls = "h-11 text-xs font-semibold text-slate-500";

export function WalletTransactionTable({
  rows,
  showUserColumn = false,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 hover:bg-transparent">
            {showUserColumn && <TableHead className={headCls}>Pengguna</TableHead>}
            <TableHead className={headCls}>Tanggal</TableHead>
            <TableHead className={headCls}>Jenis / Keterangan</TableHead>
            <TableHead className={cn(headCls, "text-right")}>Nominal</TableHead>
            <TableHead className={headCls}>Status</TableHead>
            <TableHead className={headCls}>Referensi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => {
            const { tone } = getTxTypeMeta(row.type);
            const dt = formatDateTimeId(row.created_at);
            const description =
              typeof row.description === "string" && row.description
                ? row.description
                : null;
            const typeLabel =
              typeof row.type === "string" && row.type ? row.type : null;
            const reference =
              row.source?.reference_no ||
              row.reference_no ||
              row.payment?.reference_no ||
              null;

            return (
              <TableRow
                key={row.id ?? idx}
                className="border-slate-100 hover:bg-slate-50/60"
              >
                {showUserColumn && (
                  <TableCell className="max-w-[200px] py-4 text-sm">
                    {row.user?.name ? (
                      <>
                        <p className="font-medium text-slate-900">
                          {row.user.name}
                        </p>
                        {row.user.email && (
                          <p className="truncate text-xs text-slate-500">
                            {row.user.email}
                          </p>
                        )}
                      </>
                    ) : row.user?.id != null ? (
                      <span className="text-slate-700">User #{row.user.id}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                )}

                <TableCell className="whitespace-nowrap py-4 text-sm">
                  {dt ? (
                    <>
                      <p className="text-slate-900">{dt.date}</p>
                      <p className="text-xs tabular-nums text-slate-500">
                        {dt.time}
                      </p>
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>

                <TableCell className="min-w-[240px] max-w-[340px] py-4">
                  <div className="flex items-center gap-3">
                    <TxIconCircle type={row.type} />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium text-slate-900">
                        {description ?? typeLabel ?? "—"}
                      </p>
                      {description && typeLabel && (
                        <p className="text-xs capitalize text-slate-500">
                          {typeLabel.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell
                  className={cn(
                    "whitespace-nowrap py-4 text-right text-sm font-semibold tabular-nums",
                    TX_AMOUNT_CLASS[tone]
                  )}
                >
                  {formatSignedRupiah(
                    typeof row.amount === "string" ||
                      typeof row.amount === "number"
                      ? row.amount
                      : 0,
                    tone
                  )}
                </TableCell>

                <TableCell className="py-4">
                  <StatusBadge status={row.status} />
                </TableCell>

                <TableCell className="max-w-[180px] break-all py-4 text-xs text-slate-600">
                  {reference ? String(reference) : "–"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

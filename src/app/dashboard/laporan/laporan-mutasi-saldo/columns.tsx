"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDateIdLong } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";

// Tipe data, contoh dummy
type BalanceHistory = {
  mutation: string;
  value: number;
  status: string;
  createdAt: string;
  releasedAt: string;
};

export const columns: ColumnDef<BalanceHistory>[] = [
  {
    header: "NO",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "mutation",
    header: "MUTASI",
  },
  {
    accessorKey: "value",
    header: "NILAI",
    cell: ({ row }) => formatRupiah(row.original.value),
  },
  {
    accessorKey: "status",
    header: "STATUS",
  },
  {
    accessorKey: "createdAt",
    header: "TANGGAL DIBUAT/ESTIMASI",
    cell: ({ row }) => formatDateIdLong(row.original.createdAt),
  },
  {
    accessorKey: "releasedAt",
    header: "TANGGAL RILIS",
    cell: ({ row }) => formatDateIdLong(row.original.releasedAt),
  },
];

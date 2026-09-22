"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import Image from "next/image";
import { DeliveryReport } from "@/types/laporanPengiriman";

const headCls = "h-11 text-xs font-semibold text-slate-500";

interface DataTableProps<TData extends DeliveryReport, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hasFilter: boolean;
}

export function DataTable<TData extends DeliveryReport, TValue>({
  columns,
  data,
  hasFilter,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-slate-100 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={`${headCls} whitespace-nowrap`}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-slate-100 hover:bg-slate-50/60"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap py-4 text-sm text-slate-700"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <Image
                      src="/images/search.png"
                      alt="Tidak ada data"
                      width={100}
                      height={100}
                      className="h-28 w-28 object-contain"
                    />
                    <p className="text-sm font-medium text-slate-600">
                      Data Tidak Ditemukan
                    </p>
                    <p className="text-xs text-slate-400">
                      {hasFilter
                        ? "Tidak ada data untuk filter ini."
                        : "Belum ada data pengiriman pada periode ini."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > 0 && (
        <NumberedPagination
          page={pagination.pageIndex + 1}
          lastPage={Math.max(table.getPageCount(), 1)}
          total={data.length}
          perPage={pagination.pageSize}
          onPageChange={(p) =>
            setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
          }
          onPerPageChange={(n) => setPagination({ pageIndex: 0, pageSize: n })}
        />
      )}
    </div>
  );
}

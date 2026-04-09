"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
} from "@/components/ui/popover";
import {  ChevronDown } from "lucide-react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "./date-picker-with-range";
import { DataTablePagination } from './pagination';
import { DateRange } from "react-day-picker";

interface DataTableProps<TData extends BalanceHistory, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  dateRange?: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  loading?: boolean;
  error?: string | null;
}

type BalanceHistory = {
  mutation: string;
  value: number;
  status: string;
  createdAt: string;
  releasedAt: string;
};

export function DataTable<TData extends BalanceHistory, TValue>({
  columns,
  data,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  loading = false,
  error = null,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = React.useState("");

  // ✨ Filter Data Berdasarkan Status dan Date
  const filteredData = React.useMemo(() => {
    return data.filter((item: BalanceHistory) => {
      // Filter status
      const statusMatch =
        statusFilter === "Semua Status" || item.status === statusFilter;

      // Filter tanggal createdAt
      const dateMatch =
        !dateRange?.from || !dateRange?.to
          ? true
          : (() => {
              const createdAtDate = new Date(item.createdAt);
              // Zero out time to just compare date if needed
              return (
                createdAtDate.getTime() >= dateRange.from.getTime() &&
                createdAtDate.getTime() <= dateRange.to.getTime()
              );
            })();

      return statusMatch && dateMatch;
    });
  }, [data, statusFilter, dateRange]);

  



  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-4 space-y-4">
      {/* Filter & Search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <div>
            <Label htmlFor="cari-resi">Cari Data</Label>
            <Input
              placeholder="Cari data"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div>
            <Label htmlFor="cari-resi">Pilih Range Tanggal</Label>
            <Popover>
              {setDateRange && (
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              )}
            </Popover>
          </div>
          <div>
            <Label htmlFor="filter-status">Filter Status</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  {statusFilter}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="flex flex-col p-2 space-y-1">
                  {[
                    "Semua Status",
                    "Pending",
                    "Sukses",
                    "Gagal",
                  ].map((status) => (
                    <Button
                      key={status}
                      variant="ghost"
                      className="justify-start"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Memuat data mutasi saldo...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-red-600"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Image
                      src="/images/search.png"
                      alt="No data"
                      width={100}
                      height={100}
                      className="object-contain w-40 h-40"
                    />
                    <div className="text-sm font-medium text-gray-500">
                      Data Tidak Ditemukan
                    </div>
                    <div className="text-xs text-gray-400">
                      Kami tidak bisa menemukan apa yang kamu cari, coba cari
                      lagi yuk!
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}

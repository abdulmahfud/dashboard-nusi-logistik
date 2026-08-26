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
import { Popover } from "@/components/ui/popover";
import { ChevronDown, RefreshCw } from "lucide-react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "./date-picker-with-range";
import { DataTablePagination } from "./pagination";
import { DateRange } from "react-day-picker";
import { DeliveryReport, STATUS_MAPPING } from "@/types/laporanPengiriman";

interface DataTableProps<TData extends DeliveryReport, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  dateRange?: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  packageTypeFilter: string;
  setPackageTypeFilter: React.Dispatch<React.SetStateAction<string>>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// Create reverse mapping outside component for performance
const STATUS_MAPPING_REVERSE: Record<string, string> = {};
Object.entries(STATUS_MAPPING).forEach(([key, value]) => {
  STATUS_MAPPING_REVERSE[value] = key;
});

export function DataTable<TData extends DeliveryReport, TValue>({
  columns,
  data,
  dateRange,
  setDateRange,
  onRefresh,
  isRefreshing,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState<string>("Semua Status");
  const [packageTypeFilter, setPackageTypeFilter] =
    React.useState<string>("Semua Jenis Paket");

  // ✨ Filter Data Berdasarkan Status dan Date
  const filteredData = React.useMemo(() => {
    return data.filter((item: DeliveryReport) => {
      // Debug: Log status values to understand the data format
      if (statusFilter === "Menunggu Pembayaran") {
        console.log("Debug filter:", {
          itemStatus: item.status,
          statusFilter,
          reverseMappingValue: STATUS_MAPPING_REVERSE[statusFilter],
          directMatch: item.status === statusFilter,
          mappingMatch:
            STATUS_MAPPING_REVERSE[statusFilter] &&
            item.status === STATUS_MAPPING_REVERSE[statusFilter],
        });
      }

      // Status filter: Handle both display format and raw database format
      const statusMatch =
        statusFilter === "Semua Status" ||
        item.status === statusFilter ||
        // Check if the item's raw status maps to the selected display status
        (STATUS_MAPPING_REVERSE[statusFilter] &&
          item.status === STATUS_MAPPING_REVERSE[statusFilter]);

      const packageMatch =
        packageTypeFilter === "Semua Jenis Paket" ||
        item.packageType === packageTypeFilter;

      const dateMatch =
        !dateRange?.from || !dateRange?.to
          ? true
          : (() => {
              const createdAtDate = new Date(item.createdAt);
              return (
                createdAtDate.getTime() >= dateRange.from.getTime() &&
                createdAtDate.getTime() <= dateRange.to.getTime()
              );
            })();
      return statusMatch && packageMatch && dateMatch;
    });
  }, [data, statusFilter, packageTypeFilter, dateRange]);

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
    <div className="p-2 sm:p-4 space-y-4">
      {/* Filter & Search - Mobile Optimized */}
      <div className="space-y-3">
        {onRefresh && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Memuat..." : "Refresh"}
            </Button>
          </div>
        )}

        {/* Search Input - Full width on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Input */}
          <div className="w-full">
            <Label htmlFor="cari-resi" className="text-sm font-medium">
              Cari Data
            </Label>
            <Input
              placeholder="Cari nomor resi, penerima..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full mt-1"
            />
          </div>

          {/* Date Range Picker */}
          <div className="w-full">
            <Label htmlFor="date-range" className="text-sm font-medium">
              Pilih Range Tanggal
            </Label>
            <div className="mt-1">
              <Popover>
                {setDateRange && (
                  <DatePickerWithRange
                    date={dateRange}
                    setDate={setDateRange}
                  />
                )}
              </Popover>
            </div>
          </div>
        </div>

        {/* Filters - Stack on mobile, side by side on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="filter-status" className="text-sm font-medium">
              Filter Status
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-1 justify-between"
                >
                  <span className="truncate">{statusFilter}</span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <div className="flex flex-col p-2 space-y-1">
                  {[
                    "Semua Status",
                    "Menunggu Pembayaran",
                    "Belum Proses",
                    "Belum di Expedisi",
                    "Proses Pengiriman",
                    "Kendala Pengiriman",
                    "Sampai Tujuan",
                    "Retur",
                    "Dibatalkan",
                  ].map((status) => (
                    <Button
                      key={status}
                      variant="ghost"
                      className="justify-start text-sm h-8"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <Label htmlFor="filter-package" className="text-sm font-medium">
              Filter Jenis Paket
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-1 justify-between"
                >
                  <span className="truncate">{packageTypeFilter}</span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <div className="flex flex-col p-2 space-y-1">
                  {[
                    "Semua Jenis Paket",
                    "Paket Reguler",
                    "Paket Instant",
                    "COD",
                  ].map((type) => (
                    <Button
                      key={type}
                      variant="ghost"
                      className="justify-start text-sm h-8"
                      onClick={() => setPackageTypeFilter(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table - Mobile responsive with horizontal scroll */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap text-xs sm:text-sm"
                    >
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
              {filteredData.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="whitespace-nowrap text-xs sm:text-sm p-2 sm:p-4"
                      >
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
                    <div className="flex flex-col items-center justify-center py-4 sm:py-8 space-y-2 sm:space-y-4">
                      <Image
                        src="/images/search.png"
                        alt="No data"
                        width={80}
                        height={80}
                        className="object-contain w-20 h-20 sm:w-32 sm:h-32"
                      />
                      <div className="text-xs sm:text-sm font-medium text-gray-500">
                        Data Tidak Ditemukan
                      </div>
                      <div className="text-xs text-gray-400 px-4 text-center">
                        Kami tidak bisa menemukan apa yang kamu cari, coba cari
                        lagi yuk!
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}

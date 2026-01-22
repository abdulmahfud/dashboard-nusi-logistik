"use client";

import { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getOrders } from "@/lib/apiClient";
import { Order } from "@/types/laporanPengiriman";
import CancelOrderDialog from "./CancelOrderDialog";

interface CancelOrderData {
  id: number;
  vendor: string;
  reference_no: string;
  awb_no: string;
  status: string;
  service_type_code: string;
  cod_value: string;
  item_value: string;
  shipment_type: string;
  shipper_name: string;
  receiver_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  belum_proses: "bg-orange-100 text-orange-800",
  belum_di_expedisi: "bg-yellow-100 text-yellow-800",
  proses_pengiriman: "bg-blue-100 text-blue-800",
  sampai_tujuan: "bg-green-100 text-green-800",
  dibatalkan: "bg-red-100 text-red-800",
  retur: "bg-gray-100 text-gray-800",
};

export default function CancelOrderTable() {
  const [data, setData] = useState<CancelOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CancelOrderData | null>(
    null
  );
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();

      // Transform orders to cancel order format - only show specific status orders
      const transformedData: CancelOrderData[] = response.data
        .filter((order: Order) =>
          // Only show orders with specific status that can be cancelled
          ["proses_pengiriman"].includes(order.status)
        )
        .map((order: Order) => ({
          id: order.id,
          vendor: order.vendor,
          reference_no: order.reference_no,
          awb_no: order.awb_no,
          status: order.status,
          service_type_code: order.service_type_code,
          cod_value: order.cod_value,
          item_value: order.item_value,
          shipment_type: order.shipment_type,
          shipper_name: order.shipper.name,
          receiver_name: order.receiver.name,
        }));

      setData(transformedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Gagal memuat data pesanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelClick = (order: CancelOrderData) => {
    setSelectedOrder(order);
    setShowCancelDialog(true);
  };

  const handleCancelSuccess = () => {
    setShowCancelDialog(false);
    setSelectedOrder(null);
    fetchOrders(); // Refresh data
    toast.success("Pesanan berhasil dibatalkan");
  };

  const columns: ColumnDef<CancelOrderData>[] = [
    {
      accessorKey: "vendor",
      header: "VENDOR",
      cell: ({ row }) => <Badge variant="outline">{row.original.vendor}</Badge>,
    },
    {
      accessorKey: "reference_no",
      header: "REFERENCE NO",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.reference_no}</div>
      ),
    },
    {
      accessorKey: "awb_no",
      header: "AWB NO",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.awb_no || "-"}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.original.status;
        const colorClass =
          STATUS_COLORS[status] ||
          "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900";
        return (
          <Badge className={colorClass}>
            {status.replace("_", " ").toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "service_type_code",
      header: "SERVICE TYPE",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.service_type_code}</Badge>
      ),
    },
    {
      accessorKey: "cod_value",
      header: "COD VALUE",
      cell: ({ row }) => (
        <div className="text-right">
          Rp{parseFloat(row.original.cod_value).toLocaleString("id-ID")}
        </div>
      ),
    },
    {
      accessorKey: "item_value",
      header: "ITEM VALUE",
      cell: ({ row }) => (
        <div className="text-right">
          Rp{parseFloat(row.original.item_value).toLocaleString("id-ID")}
        </div>
      ),
    },
    {
      accessorKey: "shipment_type",
      header: "SHIPMENT TYPE",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.shipment_type === "DROPOFF" ? "default" : "secondary"
          }
        >
          {row.original.shipment_type}
        </Badge>
      ),
    },
    {
      accessorKey: "shipper_name",
      header: "SHIPPER",
    },
    {
      accessorKey: "receiver_name",
      header: "RECEIVER",
    },
    {
      id: "actions",
      header: "ACTION",
      cell: ({ row }) => {
        const vendorLower = row.original.vendor.toLowerCase();
        const isCancelableVendor = ["jntexpress", "paxel", "anteraja"].includes(
          vendorLower
        );
        return (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleCancelClick(row.original)}
            disabled={!isCancelableVendor}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Cancel
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading orders...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {data.length} orders dapat dibatalkan
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
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
                    Tidak ada data pesanan yang dapat dibatalkan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </p>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <CancelOrderDialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          order={selectedOrder}
          onSuccess={handleCancelSuccess}
        />
      )}
    </>
  );
}

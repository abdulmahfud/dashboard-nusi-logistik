"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PackageX,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getOrdersPage } from "@/lib/apiClient";
import { Order } from "@/types/laporanPengiriman";
import {
  DateRangeField,
  toApiDate,
} from "@/components/redesign/date-range-field";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
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
  created_at: string;
}

/** Vendor yang didukung pembatalan (sesuai dokumentasi API). */
const SUPPORTED_VENDORS = [
  "anteraja",
  "jntexpress",
  "paxel",
  "posindonesia",
  "jne",
  "ninjaexpress",
  "idexpress",
  "jntcargo",
  "gosend",
  "lion",
  "sap",
];

/** Batas aman saat mengambil semua order berstatus proses_pengiriman. */
const FETCH_PAGE_SIZE = 100;
const FETCH_MAX_PAGES = 30;

const headCls = "h-11 text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";

const formatRp = (value: string) =>
  `Rp${parseFloat(value).toLocaleString("id-ID")}`;

export default function CancelOrderTable() {
  const [data, setData] = useState<CancelOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [range, setRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<CancelOrderData | null>(
    null
  );
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Filter status dilakukan BE; semua halaman diambil supaya tidak ada
      // order yang terlewat (endpoint ini berpaginasi).
      const orders: Order[] = [];
      let current = 1;
      let last = 1;
      do {
        const res = await getOrdersPage({
          status: "proses_pengiriman",
          page: current,
          per_page: FETCH_PAGE_SIZE,
        });
        orders.push(...(res.data ?? []));
        last = res.meta?.last_page ?? 1;
        current += 1;
      } while (current <= last && current <= FETCH_MAX_PAGES);

      // Hanya order proses_pengiriman yang punya AWB number yang bisa dibatalkan.
      const transformedData: CancelOrderData[] = orders
        .filter(
          (order: Order) =>
            order.status === "proses_pengiriman" &&
            order.awb_no &&
            order.awb_no.trim() !== ""
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
          created_at: order.created_at,
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

  const vendorOptions = useMemo(
    () => Array.from(new Set(data.map((d) => d.vendor))).sort(),
    [data]
  );
  const serviceOptions = useMemo(
    () => Array.from(new Set(data.map((d) => d.service_type_code))).sort(),
    [data]
  );

  const hasFilter =
    globalFilter.trim() !== "" ||
    vendorFilter !== "all" ||
    serviceFilter !== "all" ||
    Boolean(range?.from);

  const filtered = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    const from = range?.from ? toApiDate(range.from) : null;
    const to = range?.from ? toApiDate(range.to ?? range.from) : null;
    return data.filter((row) => {
      if (
        q &&
        !(
          String(row.reference_no ?? "").toLowerCase().includes(q) ||
          String(row.awb_no ?? "").toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      if (vendorFilter !== "all" && row.vendor !== vendorFilter) return false;
      if (serviceFilter !== "all" && row.service_type_code !== serviceFilter)
        return false;
      if (from && to) {
        const created = row.created_at
          ? toApiDate(new Date(row.created_at))
          : "";
        if (created && (created < from || created > to)) return false;
      }
      return true;
    });
  }, [data, globalFilter, vendorFilter, serviceFilter, range]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const resetFilters = () => {
    setGlobalFilter("");
    setVendorFilter("all");
    setServiceFilter("all");
    setRange(undefined);
    setPage(1);
  };

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

  return (
    <>
      <div className="space-y-4">
        {/* Pencarian & filter */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                placeholder="Cari REFERENCE NO atau AWB NO..."
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPage(1);
                }}
                className={`${fieldCls} pl-9`}
              />
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-sm text-slate-600">
                {filtered.length} dari {data.length} orders dapat dibatalkan
              </span>
              {hasFilter && (
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="h-11 shrink-0 gap-2 rounded-lg text-slate-600"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </Button>
              )}
              <Button
                variant="outline"
                onClick={fetchOrders}
                disabled={loading}
                className="h-11 shrink-0 gap-2 rounded-lg border-slate-200"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <DateRangeField
              value={range}
              onChange={(r) => {
                setRange(r);
                setPage(1);
              }}
              placeholder="Pilih rentang tanggal"
            />
            <Select
              value={vendorFilter}
              onValueChange={(v) => {
                setVendorFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className={fieldCls} aria-label="Filter vendor">
                <SelectValue placeholder="Semua Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Vendor</SelectItem>
                {vendorOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={serviceFilter}
              onValueChange={(v) => {
                setServiceFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger
                className={fieldCls}
                aria-label="Filter service type"
              >
                <SelectValue placeholder="Semua Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Service Type</SelectItem>
                {serviceOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <Table>
            <TableHeader className="bg-slate-50/60">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className={headCls}>Vendor</TableHead>
                <TableHead className={headCls}>Reference No</TableHead>
                <TableHead className={headCls}>AWB No</TableHead>
                <TableHead className={headCls}>Status</TableHead>
                <TableHead className={headCls}>Service Type</TableHead>
                <TableHead className={headCls}>COD Value</TableHead>
                <TableHead className={headCls}>Item Value</TableHead>
                <TableHead className={headCls}>Shipment Type</TableHead>
                <TableHead className={headCls}>Shipper</TableHead>
                <TableHead className={headCls}>Receiver</TableHead>
                <TableHead className={headCls}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center">
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Loading orders...
                    </span>
                  </TableCell>
                </TableRow>
              ) : pageRows.length ? (
                pageRows.map((row) => {
                  const vendorLower = row.vendor.toLowerCase();
                  const isCancelableVendor =
                    SUPPORTED_VENDORS.includes(vendorLower);
                  const hasAwbNo = row.awb_no && row.awb_no.trim() !== "";
                  return (
                    <TableRow
                      key={row.id}
                      className="border-slate-100 hover:bg-slate-50/60"
                    >
                      <TableCell className="py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {row.vendor}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 font-mono text-xs text-slate-800">
                        {row.reference_no}
                      </TableCell>
                      <TableCell className="py-4 font-mono text-xs text-slate-800">
                        {row.awb_no || "-"}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {row.status.replace("_", " ").toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {row.service_type_code}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-4 text-right text-sm tabular-nums text-slate-700">
                        {formatRp(row.cod_value)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-4 text-right text-sm tabular-nums text-slate-700">
                        {formatRp(row.item_value)}
                      </TableCell>
                      <TableCell className="py-4">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                            row.shipment_type === "DROPOFF"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {row.shipment_type}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-slate-700">
                        {row.shipper_name}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-slate-700">
                        {row.receiver_name}
                      </TableCell>
                      <TableCell className="py-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelClick(row)}
                          disabled={!isCancelableVendor || !hasAwbNo}
                          className="h-9 gap-2 rounded-lg"
                          title={
                            !hasAwbNo
                              ? "AWB number tidak tersedia"
                              : !isCancelableVendor
                              ? `Vendor ${row.vendor} tidak didukung`
                              : "Batalkan pesanan"
                          }
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center">
                    <div className="flex flex-col items-center">
                      <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
                        <PackageX
                          className="h-9 w-9 text-rose-300"
                          aria-hidden
                        />
                      </span>
                      <p className="font-semibold text-slate-900">
                        {hasFilter
                          ? "Tidak ada pesanan yang cocok dengan filter."
                          : "Tidak ada data pesanan yang dapat dibatalkan."}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Coba ubah filter pencarian atau rentang tanggal.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <NumberedPagination
            page={safePage}
            lastPage={totalPages}
            total={filtered.length}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
          />
        )}
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

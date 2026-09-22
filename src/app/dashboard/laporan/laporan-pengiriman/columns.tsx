"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DeliveryReport } from "@/types/laporanPengiriman";
import { PrintLabelButton } from "@/components/Laporan/PrintLabelButton";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Hourglass,
  Info,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** Warna badge status khusus laporan pengiriman (nama status sudah berbahasa Indonesia). */
const STATUS_STYLE: Record<
  string,
  { className: string; icon: typeof Package }
> = {
  "Menunggu Pembayaran": {
    className: "bg-amber-50 text-amber-700",
    icon: CreditCard,
  },
  "Belum Proses": { className: "bg-amber-50 text-amber-700", icon: Hourglass },
  "Belum di Expedisi": {
    className: "bg-slate-100 text-slate-600",
    icon: Info,
  },
  "Proses Pengiriman": { className: "bg-blue-50 text-blue-700", icon: Truck },
  "Kendala Pengiriman": {
    className: "bg-rose-50 text-rose-700",
    icon: AlertTriangle,
  },
  "Sampai Tujuan": {
    className: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  Retur: { className: "bg-violet-50 text-violet-700", icon: RefreshCw },
  Dibatalkan: { className: "bg-rose-50 text-rose-700", icon: XCircle },
};

export function DeliveryStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? {
    className: "bg-slate-100 text-slate-600",
    icon: Package,
  };
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        style.className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {status}
    </span>
  );
}

// Kolom tabel
export const columns: ColumnDef<DeliveryReport>[] = [
  {
    header: "NO",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "shipmentNo",
    header: "NO RESI / AWB",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-slate-700">
        {row.original.shipmentNo}
      </span>
    ),
  },
  {
    accessorKey: "packageType",
    header: "JENIS PAKET",
  },
  {
    accessorKey: "recipient",
    header: "PENERIMA",
  },
  {
    accessorKey: "courierService",
    header: "EKSPEDISI / LAYANAN",
  },
  {
    accessorKey: "totalShipment",
    header: "HARGA",
    cell: ({ row }) => formatRupiah(row.original.totalShipment),
  },
  {
    accessorKey: "shippingMethod",
    header: "METODE PENGIRIMAN",
  },
  {
    accessorKey: "service",
    header: "TIPE LAYANAN",
  },
  {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ row }) => <DeliveryStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: "AKSI",
    cell: ({ row }) => {
      const order = row.original;
      const hasAwb =
        order.shipmentNo &&
        order.shipmentNo !== "-" &&
        order.status !== "Menunggu Pembayaran";

      if (!hasAwb) {
        return (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 gap-1.5 rounded-lg text-xs"
          >
            <Clock className="h-3.5 w-3.5" />
            Belum Tersedia
          </Button>
        );
      }

      return (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/dashboard/tracking?awb=${encodeURIComponent(order.shipmentNo)}`}
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg text-xs"
            >
              <Package className="h-3.5 w-3.5" />
              Lacak
            </Button>
          </Link>
          <PrintLabelButton
            orderId={order.orderId}
            className="h-8 gap-1.5 rounded-lg text-xs"
          />
        </div>
      );
    },
  },
];

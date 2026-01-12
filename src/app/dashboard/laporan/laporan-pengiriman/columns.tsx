"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DeliveryReport } from "@/types/laporanPengiriman";
import { PrintLabelButton } from "@/components/Laporan/PrintLabelButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CreditCard } from "lucide-react";
import Link from "next/link";

// Kolom tabel
export const columns: ColumnDef<DeliveryReport>[] = [
  {
    header: "NO",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "shipmentNo",
    header: "NO RESI / AWB",
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
    header: "EXPEDISI / LAYANAN",
  },
  {
    accessorKey: "totalShipment",
    header: "HARGA",
    cell: ({ row }) => {
      const amount = row.original.totalShipment;
      return `Rp${amount.toLocaleString()}`;
    },
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
    cell: ({ row }) => {
      const status = row.original.status;

      // Define status configurations
      const statusConfig = {
        menunggu_pembayaran: {
          label: "Menunggu Pembayaran",
          variant: "destructive" as const,
          icon: CreditCard,
        },
        belum_proses: {
          label: "Belum Diproses",
          variant: "secondary" as const,
          icon: Clock,
        },
        belum_di_expedisi: {
          label: "Belum di Expedisi",
          variant: "outline" as const,
          icon: Package,
        },
        proses_pengiriman: {
          label: "Proses Pengiriman",
          variant: "default" as const,
          icon: Package,
        },
        kendala_pengiriman: {
          label: "Kendala Pengiriman",
          variant: "destructive" as const,
          icon: Package,
        },
        sampai_tujuan: {
          label: "Sampai Tujuan",
          variant: "default" as const,
          icon: Package,
        },
        retur: {
          label: "Retur",
          variant: "secondary" as const,
          icon: Package,
        },
        dibatalkan: {
          label: "Dibatalkan",
          variant: "destructive" as const,
          icon: Package,
        },
      };

      const config = statusConfig[status as keyof typeof statusConfig] || {
        label: status,
        variant: "outline" as const,
        icon: Package,
      };

      const IconComponent = config.icon;

      return (
        <Badge variant={config.variant} className="gap-1">
          <IconComponent className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "TANGGAL DIBUAT",
  },
  {
    id: "tracking",
    header: "TRACKING",
    cell: ({ row }) => {
      const order = row.original;
      const hasAwb =
        order.shipmentNo &&
        order.shipmentNo !== "-" &&
        order.status !== "menunggu_pembayaran";

      if (!hasAwb) {
        return (
          <Button variant="outline" size="sm" disabled className="w-full">
            <Clock className="h-4 w-4 mr-1" />
            Belum Tersedia
          </Button>
        );
      }

      return (
        <Link
          href={`/dashboard/tracking?awb=${encodeURIComponent(order.shipmentNo)}`}
        >
          <Button variant="outline" size="sm" className="w-full">
            <Package className="h-4 w-4 mr-1" />
            Lacak
          </Button>
        </Link>
      );
    },
  },
  {
    id: "actions",
    header: "CETAK RESI",
    cell: ({ row }) => {
      const order = row.original;
      const hasAwb =
        order.shipmentNo &&
        order.shipmentNo !== "-" &&
        order.status !== "menunggu_pembayaran";

      if (!hasAwb) {
        return (
          <Button variant="outline" size="sm" disabled className="w-32">
            <Clock className="h-4 w-4 mr-1" />
            Belum Tersedia
          </Button>
        );
      }

      return <PrintLabelButton orderId={order.orderId} className="w-32" />;
    },
  },
];

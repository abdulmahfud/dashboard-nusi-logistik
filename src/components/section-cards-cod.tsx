"use client";

import {
  BookX,
  Boxes,
  PackageMinus,
  PackageX,
  RefreshCcwDot,
  Truck,
} from "lucide-react";
import { useMemo } from "react";

import { SectionCard } from "@/components/redesign/section-card";
import { InlineStat } from "@/components/redesign/inline-stat";
import { classifyPackageType, countByStatus } from "@/lib/dashboardShipmentStats";
import type { Order } from "@/types/laporanPengiriman";

export function SectionCardsCod({
  orders,
  loading,
}: {
  orders: Order[];
  loading: boolean;
}) {
  // Sumber & klasifikasi sama dengan dashboard/laporan/laporan-pengiriman
  // (service_type_code === "COD"), bukan endpoint statistik terpisah -
  // supaya angkanya selalu sesuai dengan laporan itu.
  const stats = useMemo(() => {
    const codOrders = orders.filter((o) => classifyPackageType(o) === "COD");
    return countByStatus(codOrders);
  }, [orders]);

  return (
    <SectionCard icon={Boxes} title="Ringkasan Paket COD">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <InlineStat
          icon={BookX}
          tone="blue"
          label="Belum Proses"
          value={stats.belum}
          loading={loading}
        />
        <InlineStat
          icon={Truck}
          tone="blue"
          label="Proses Pengiriman"
          value={stats.proses}
          loading={loading}
        />
        <InlineStat
          icon={RefreshCcwDot}
          tone="green"
          label="Sampai Tujuan"
          value={stats.sampai}
          loading={loading}
        />
        <InlineStat
          icon={Boxes}
          tone="red"
          label="Kendala Pengiriman"
          value={stats.kendala}
          loading={loading}
        />
        <InlineStat
          icon={PackageX}
          tone="orange"
          label="Total Retur"
          value={stats.retur}
          loading={loading}
        />
        <InlineStat
          icon={PackageMinus}
          tone="violet"
          label="Dibatalkan"
          value={stats.dibatalkan}
          loading={loading}
        />
      </div>
    </SectionCard>
  );
}

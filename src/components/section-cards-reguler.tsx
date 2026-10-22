"use client";

import {
  Box,
  PackageCheck,
  PackageMinus,
  PackageX,
  Truck,
  Vault,
} from "lucide-react";
import { useMemo } from "react";

import { SectionCard } from "@/components/redesign/section-card";
import { InlineStat } from "@/components/redesign/inline-stat";
import { classifyPackageType, countByStatus } from "@/lib/dashboardShipmentStats";
import type { Order } from "@/types/laporanPengiriman";

export function SectionCardsReguler({
  orders,
  loading,
}: {
  orders: Order[];
  loading: boolean;
}) {
  // Sumber & klasifikasi sama dengan dashboard/laporan/laporan-pengiriman
  // (service_type_code === "REGULER"/default), bukan endpoint statistik
  // terpisah - supaya angkanya selalu sesuai dengan laporan itu.
  const stats = useMemo(() => {
    const regulerOrders = orders.filter(
      (o) => classifyPackageType(o) === "Paket Reguler"
    );
    return countByStatus(regulerOrders);
  }, [orders]);

  return (
    <SectionCard icon={Box} title="Ringkasan Paket Reguler">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <InlineStat
          icon={Box}
          tone="slate"
          label="Paket Belum Dibayar"
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
          icon={Vault}
          tone="red"
          label="Kendala Pengiriman"
          value={stats.kendala}
          loading={loading}
        />
        <InlineStat
          icon={PackageCheck}
          tone="green"
          label="Sampai Tujuan"
          value={stats.sampai}
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

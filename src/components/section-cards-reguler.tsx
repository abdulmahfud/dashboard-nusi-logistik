"use client";

import {
  Box,
  PackageCheck,
  PackageMinus,
  PackageX,
  Truck,
  Vault,
} from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { SectionCard } from "@/components/redesign/section-card";
import { InlineStat } from "@/components/redesign/inline-stat";
import { getOrderStatistics } from "@/lib/apiClient";

interface RegularStats {
  totalPaket: number;
  prosesPengiriman: number;
  kendalaPengiriman: number;
  sampaiTujuan: number;
  totalRetur: number;
  dibatalkan: number;
}

export function SectionCardsReguler({
  dateRange,
}: {
  dateRange: DateRange | undefined;
}) {
  const [stats, setStats] = useState<RegularStats>({
    totalPaket: 0,
    prosesPengiriman: 0,
    kendalaPengiriman: 0,
    sampaiTujuan: 0,
    totalRetur: 0,
    dibatalkan: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchRegularStats = async () => {
    try {
      setLoading(true);

      const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
      const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : startDate;

      const response = await getOrderStatistics(startDate, endDate);
      const regularPackageStats = response.data.regular_package_stats;

      setStats({
        totalPaket: regularPackageStats.total,
        prosesPengiriman: regularPackageStats.proses_pengiriman,
        kendalaPengiriman: regularPackageStats.kendala_pengiriman,
        sampaiTujuan: regularPackageStats.sampai_tujuan,
        totalRetur: regularPackageStats.retur,
        dibatalkan: regularPackageStats.dibatalkan,
      });
    } catch (err) {
      console.error("Failed to fetch regular package statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRegularStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  return (
    <SectionCard icon={Box} title="Ringkasan Paket Reguler">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <InlineStat
          icon={Box}
          tone="slate"
          label="Total Paket"
          value={stats.totalPaket}
          loading={loading}
        />
        <InlineStat
          icon={Truck}
          tone="blue"
          label="Proses Pengiriman"
          value={stats.prosesPengiriman}
          loading={loading}
        />
        <InlineStat
          icon={Vault}
          tone="red"
          label="Kendala Pengiriman"
          value={stats.kendalaPengiriman}
          loading={loading}
        />
        <InlineStat
          icon={PackageCheck}
          tone="green"
          label="Sampai Tujuan"
          value={stats.sampaiTujuan}
          loading={loading}
        />
        <InlineStat
          icon={PackageX}
          tone="orange"
          label="Total Retur"
          value={stats.totalRetur}
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

"use client";

import { BookX, Boxes, PackageX, RefreshCcwDot, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { SectionCard } from "@/components/redesign/section-card";
import { InlineStat } from "@/components/redesign/inline-stat";
import { getOrderStatistics } from "@/lib/apiClient";

interface CODStats {
  belumDiEkspedisi: number;
  prosesPengiriman: number;
  sampaiTujuan: number;
  kendalaPengiriman: number;
  totalRetur: number;
}

export function SectionCardsCod({
  dateRange,
}: {
  dateRange: DateRange | undefined;
}) {
  const [stats, setStats] = useState<CODStats>({
    belumDiEkspedisi: 0,
    prosesPengiriman: 0,
    sampaiTujuan: 0,
    kendalaPengiriman: 0,
    totalRetur: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCODStats = async () => {
    try {
      setLoading(true);
      const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
      const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : startDate;

      const response = await getOrderStatistics(startDate, endDate);
      const codPackageStats = response.data.cod_package_stats;

      setStats({
        belumDiEkspedisi:
          codPackageStats.belum_di_expedisi + codPackageStats.belum_proses,
        prosesPengiriman: codPackageStats.proses_pengiriman,
        sampaiTujuan: codPackageStats.sampai_tujuan,
        kendalaPengiriman: codPackageStats.kendala_pengiriman,
        totalRetur: codPackageStats.retur,
      });
    } catch (error) {
      console.error("Failed to fetch COD statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCODStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  return (
    <SectionCard icon={Boxes} title="Ringkasan Paket COD">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <InlineStat
          icon={BookX}
          tone="blue"
          label="Belum di Ekspedisi"
          value={stats.belumDiEkspedisi}
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
          icon={RefreshCcwDot}
          tone="green"
          label="Sampai Tujuan"
          value={stats.sampaiTujuan}
          loading={loading}
        />
        <InlineStat
          icon={Boxes}
          tone="red"
          label="Kendala Pengiriman"
          value={stats.kendalaPengiriman}
          loading={loading}
        />
        <InlineStat
          icon={PackageX}
          tone="orange"
          label="Total Retur"
          value={stats.totalRetur}
          loading={loading}
        />
      </div>
    </SectionCard>
  );
}

"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { SectionCard } from "@/components/redesign/section-card";
import { InlineStat } from "@/components/redesign/inline-stat";
import { getOrderStatistics } from "@/lib/apiClient";

interface TroubleStats {
  noUpdate4to7Days: number;
  noUpdate8to30Days: number;
  noUpdateOver30Days: number;
  kendalaPengiriman: number;
}

export function SectionCardsTrouble({
  dateRange,
}: {
  dateRange: DateRange | undefined;
}) {
  const [stats, setStats] = useState<TroubleStats>({
    noUpdate4to7Days: 0,
    noUpdate8to30Days: 0,
    noUpdateOver30Days: 0,
    kendalaPengiriman: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchTroubleStats = async () => {
    try {
      setLoading(true);
      const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
      const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : startDate;

      const response = await getOrderStatistics(startDate, endDate);
      const troubleStats = response.data.trouble_stats;

      setStats({
        noUpdate4to7Days: troubleStats.no_update_4_to_7_days,
        noUpdate8to30Days: troubleStats.no_update_8_to_30_days,
        noUpdateOver30Days: troubleStats.no_update_over_30_days,
        kendalaPengiriman: response.data.status_overview.kendala_pengiriman,
      });
    } catch (error) {
      console.error("Failed to fetch trouble statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTroubleStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  return (
    <SectionCard icon={AlertTriangle} title="Ringkasan Paket Bermasalah">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InlineStat
          icon={RefreshCcw}
          tone="amber"
          label="Tidak ada update 4-7 hari"
          value={stats.noUpdate4to7Days}
          loading={loading}
        />
        <InlineStat
          icon={RefreshCcw}
          tone="amber"
          label="Tidak ada update 8-30 hari"
          value={stats.noUpdate8to30Days}
          loading={loading}
        />
        <InlineStat
          icon={RefreshCcw}
          tone="red"
          label="Tidak ada update > 30 hari"
          value={stats.noUpdateOver30Days}
          loading={loading}
        />
        <InlineStat
          icon={AlertTriangle}
          tone="red"
          label="Kendala Pengiriman"
          value={stats.kendalaPengiriman}
          loading={loading}
        />
      </div>
    </SectionCard>
  );
}

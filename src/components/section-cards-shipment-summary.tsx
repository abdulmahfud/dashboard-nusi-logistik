"use client";

import { useEffect, useMemo, useState } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";

import { SectionCard } from "@/components/redesign/section-card";
import { getOrders } from "@/lib/apiClient";
import type { Order } from "@/types/laporanPengiriman";

type StatusKey = "proses" | "sampai" | "belum" | "dibatalkan" | "retur";

const STATUS_META: Record<
  StatusKey,
  { label: string; color: string; match: (status: string) => boolean }
> = {
  proses: {
    label: "Proses Pengiriman",
    color: "#2563eb",
    match: (s) => s === "proses_pengiriman",
  },
  sampai: {
    label: "Sampai Tujuan",
    color: "#10b981",
    match: (s) => s === "sampai_tujuan",
  },
  belum: {
    label: "Belum di Kurir",
    color: "#ef4444",
    match: (s) => s === "belum_proses" || s === "belum_di_expedisi",
  },
  dibatalkan: {
    label: "Dibatalkan",
    color: "#7c3aed",
    match: (s) => s === "dibatalkan",
  },
  retur: {
    label: "Retur / Kendala",
    color: "#f97316",
    match: (s) => s === "retur" || s === "kendala_pengiriman",
  },
};

const LINE_KEYS: StatusKey[] = ["proses", "sampai", "belum"];

type DailyPoint = { date: string; label: string } & Record<StatusKey, number>;

function buildDailySeries(orders: Order[], range: DateRange): DailyPoint[] {
  const from = range.from;
  const to = range.to ?? range.from;
  if (!from || !to) return [];

  const days = eachDayOfInterval({ start: from, end: to });
  return days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const dayOrders = orders.filter((o) => o.created_at.slice(0, 10) === key);
    const point: DailyPoint = {
      date: key,
      label: format(day, "d MMM", { locale: idLocale }),
      proses: 0,
      sampai: 0,
      belum: 0,
      dibatalkan: 0,
      retur: 0,
    };
    (Object.keys(STATUS_META) as StatusKey[]).forEach((k) => {
      point[k] = dayOrders.filter((o) => STATUS_META[k].match(o.status)).length;
    });
    return point;
  });
}

function buildStatusBreakdown(orders: Order[]) {
  const total = orders.length;
  const entries = (Object.keys(STATUS_META) as StatusKey[]).map((key) => {
    const count = orders.filter((o) => STATUS_META[key].match(o.status)).length;
    return {
      key,
      label: STATUS_META[key].label,
      color: STATUS_META[key].color,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  });
  return { entries, total };
}

export function SectionCardsShipmentSummary({
  dateRange,
}: {
  dateRange: DateRange | undefined;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const startDate = dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined;
        const endDate = dateRange?.to
          ? format(dateRange.to, "yyyy-MM-dd")
          : startDate;
        const res = await getOrders(startDate, endDate);
        if (!cancelled) setOrders(res.data ?? []);
      } catch (err) {
        console.error("Failed to fetch shipment summary:", err);
        if (!cancelled) setError("Gagal memuat ringkasan pengiriman.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  const dailySeries = useMemo(
    () => (dateRange ? buildDailySeries(orders, dateRange) : []),
    [orders, dateRange]
  );
  const { entries: statusEntries, total } = useMemo(
    () => buildStatusBreakdown(orders),
    [orders]
  );

  const rangeDays = dailySeries.length;

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-5">
      <div className="xl:col-span-3">
        <SectionCard
          className="h-full"
          icon={LineChartIcon}
          title="Ringkasan Pengiriman"
          description={
            rangeDays > 0 ? `${rangeDays} hari terakhir` : undefined
          }
        >
          {error ? (
            <p className="py-10 text-center text-sm text-red-600">{error}</p>
          ) : loading ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              Memuat data...
            </div>
          ) : total === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              Belum ada pengiriman pada periode ini.
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                {LINE_KEYS.map((k) => (
                  <span
                    key={k}
                    className="flex items-center gap-1.5 text-xs text-slate-600"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_META[k].color }}
                    />
                    {STATUS_META[k].label}
                  </span>
                ))}
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySeries}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      width={24}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    {LINE_KEYS.map((k) => (
                      <Line
                        key={k}
                        type="monotone"
                        dataKey={k}
                        name={STATUS_META[k].label}
                        stroke={STATUS_META[k].color}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <div className="xl:col-span-2">
        <SectionCard
          className="h-full"
          icon={PieChartIcon}
          title="Ringkasan Status Pengiriman"
        >
          {loading ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              Memuat data...
            </div>
          ) : total === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              Belum ada pengiriman pada periode ini.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="relative h-[200px] w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusEntries}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {statusEntries.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {total}
                  </span>
                  <span className="text-xs text-slate-500">Paket</span>
                </div>
              </div>

              <div className="w-full min-w-0 space-y-2.5">
                {statusEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="truncate">{entry.label}</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-slate-900">
                      {entry.count}{" "}
                      <span className="text-slate-400">
                        ({entry.percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

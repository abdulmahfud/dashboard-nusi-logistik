"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import {
  DateRangeField,
  toApiDate,
} from "@/components/redesign/date-range-field";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardListIcon,
  Download,
  Hourglass,
  Info,
  Loader2,
  Package,
  Package2,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getOrders } from "@/lib/apiClient";
import {
  Order,
  DeliveryReport,
  STATUS_MAPPING,
  VENDOR_MAPPING,
} from "@/types/laporanPengiriman";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  "Semua Status",
  "Menunggu Pembayaran",
  "Belum Proses",
  "Belum di Expedisi",
  "Proses Pengiriman",
  "Kendala Pengiriman",
  "Sampai Tujuan",
  "Retur",
  "Dibatalkan",
];

const PACKAGE_TYPE_OPTIONS = [
  "Semua Jenis Paket",
  "Paket Reguler",
  "Paket Instant",
  "COD",
];

const transformOrderToDeliveryReport = (order: Order): DeliveryReport => {
  let packageType: DeliveryReport["packageType"] = "Paket Reguler";
  if (order.service_type_code === "COD") {
    packageType = "COD";
  } else if (order.service_type_code === "REGULER") {
    packageType = "Paket Reguler";
  } else if (order.service_type_code === "INSTANT") {
    packageType = "Paket Instant";
  }

  const courierService = VENDOR_MAPPING[order.vendor] || order.vendor;
  const status = STATUS_MAPPING[order.status] || order.status;
  const shippingMethod: DeliveryReport["shippingMethod"] =
    order.service_type_code === "COD" ? "COD" : "REGULER";
  const service: DeliveryReport["service"] =
    order.shipment_type === "PICKUP" ? "PICKUP" : "DROPOFF";
  const totalShipment =
    parseFloat(order.cod_value) || parseFloat(order.item_value) || 0;
  const createdAt = new Date(order.created_at).toISOString().split("T")[0];

  return {
    orderId: order.id,
    createdAt,
    shipmentNo: order.awb_no || order.reference_no,
    packageType,
    recipient: order.receiver.name,
    courierService,
    totalShipment,
    shippingMethod,
    service,
    status,
    vendor: order.vendor,
  };
};

function exportDeliveryReportCsv(rows: DeliveryReport[]) {
  const headers = [
    "No Resi/AWB",
    "Jenis Paket",
    "Penerima",
    "Ekspedisi/Layanan",
    "Harga",
    "Metode Pengiriman",
    "Tipe Layanan",
    "Status",
    "Tanggal Dibuat",
  ];
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  rows.forEach((r) => {
    lines.push(
      [
        r.shipmentNo,
        r.packageType,
        r.recipient,
        r.courierService,
        r.totalShipment,
        r.shippingMethod,
        r.service,
        r.status,
        r.createdAt,
      ]
        .map(escape)
        .join(",")
    );
  });
  const csv = "﻿" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-pengiriman-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Tone = "blue" | "violet" | "green" | "orange" | "amber" | "slate" | "rose";

const TONE_CLASS: Record<Tone, { icon: string; bar: string; badge: string }> = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    bar: "bg-blue-600",
    badge: "bg-blue-50 text-blue-700",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600",
    bar: "bg-violet-600",
    badge: "bg-violet-50 text-violet-700",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
  },
  orange: {
    icon: "bg-orange-50 text-orange-500",
    bar: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
  },
  slate: {
    icon: "bg-slate-100 text-slate-500",
    bar: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    bar: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700",
  },
};

function ProgressStatCard({
  icon: Icon,
  tone,
  title,
  value,
  hint,
  percentage,
  horizontal,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  value: number;
  hint: string;
  percentage?: number;
  /** Ikon besar di kiri, judul+nilai+bar di kanan (dipakai untuk 4 kartu ringkasan utama). */
  horizontal?: boolean;
}) {
  const t = TONE_CLASS[tone];
  const bar = percentage !== undefined && (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full", t.bar)}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );

  if (horizontal) {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
        <span
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
            t.icon
          )}
        >
          <Icon className="h-7 w-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-slate-500">{title}</p>
            {percentage !== undefined && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  t.badge
                )}
              >
                {percentage}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">
            {value}
          </p>
          {bar}
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            t.icon
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        {percentage !== undefined && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              t.badge
            )}
          >
            {percentage}%
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {bar}
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

const LaporanPengiriman = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [packageTypeFilter, setPackageTypeFilter] = useState(
    "Semua Jenis Paket"
  );
  const [periode, setPeriode] = useState<DateRange | undefined>(undefined);
  const [dataReport, setDataReport] = useState<DeliveryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const startDate = periode?.from ? toApiDate(periode.from) : undefined;
        const endDate = periode?.to
          ? toApiDate(periode.to)
          : periode?.from
            ? toApiDate(periode.from)
            : undefined;
        const response = await getOrders(startDate, endDate);
        setDataReport(response.data.map(transformOrderToDeliveryReport));
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Gagal memuat data laporan pengiriman.");
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [periode]
  );

  useEffect(() => {
    void fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periode]);

  const stats = useMemo(() => {
    const total = dataReport.length;
    const reguler = dataReport.filter(
      (d) => d.packageType === "Paket Reguler"
    ).length;
    const instant = dataReport.filter(
      (d) => d.packageType === "Paket Instant"
    ).length;
    const cod = dataReport.filter(
      (d) => d.packageType === "COD" || d.shippingMethod === "COD"
    ).length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return {
      total,
      reguler,
      instant,
      cod,
      regulerPct: pct(reguler),
      instantPct: pct(instant),
      codPct: pct(cod),
    };
  }, [dataReport]);

  const statusStats = useMemo(() => {
    const total = dataReport.length;
    const count = (status: string) =>
      dataReport.filter((d) => d.status === status).length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    const entries = [
      "Belum Proses",
      "Belum di Expedisi",
      "Proses Pengiriman",
      "Kendala Pengiriman",
      "Sampai Tujuan",
      "Retur",
      "Dibatalkan",
    ].map((status) => {
      const c = count(status);
      return { status, count: c, percentage: pct(c) };
    });
    return entries;
  }, [dataReport]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dataReport.filter((item) => {
      const searchMatch =
        !q ||
        item.shipmentNo.toLowerCase().includes(q) ||
        item.recipient.toLowerCase().includes(q);
      const statusMatch =
        statusFilter === "Semua Status" || item.status === statusFilter;
      const packageMatch =
        packageTypeFilter === "Semua Jenis Paket" ||
        item.packageType === packageTypeFilter;
      return searchMatch && statusMatch && packageMatch;
    });
  }, [dataReport, search, statusFilter, packageTypeFilter]);

  const hasFilter =
    Boolean(search) ||
    statusFilter !== "Semua Status" ||
    packageTypeFilter !== "Semua Jenis Paket";

  const resetFilter = () => {
    setSearch("");
    setStatusFilter("Semua Status");
    setPackageTypeFilter("Semua Jenis Paket");
  };

  const statusIcon: Record<string, { icon: LucideIcon; tone: Tone }> = {
    "Belum Proses": { icon: Hourglass, tone: "amber" },
    "Belum di Expedisi": { icon: Info, tone: "slate" },
    "Proses Pengiriman": { icon: Truck, tone: "blue" },
    "Kendala Pengiriman": { icon: AlertTriangle, tone: "rose" },
    "Sampai Tujuan": { icon: CheckCircle2, tone: "green" },
    Retur: { icon: RefreshCw, tone: "violet" },
    Dibatalkan: { icon: XCircle, tone: "rose" },
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Laporan Pengiriman" },
            ]}
            icon={ClipboardListIcon}
            title="Laporan Pengiriman"
            description="Riwayat pengiriman dengan filter admin."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <DateRangeField
                  value={periode}
                  onChange={setPeriode}
                  placeholder="Semua periode"
                  className="w-[240px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2 rounded-lg border-slate-200 bg-white"
                  disabled={refreshing}
                  onClick={() => void fetchOrders(true)}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  Refresh
                </Button>
                <Button
                  type="button"
                  className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  disabled={filteredData.length === 0}
                  onClick={() => exportDeliveryReportCsv(filteredData)}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Export
                </Button>
              </div>
            }
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-sm text-slate-500">Memuat data...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ProgressStatCard
                  horizontal
                  icon={Package}
                  tone="blue"
                  title="Total Pengiriman"
                  value={stats.total}
                  hint="Semua pengiriman"
                />
                <ProgressStatCard
                  horizontal
                  icon={Package2}
                  tone="violet"
                  title="Paket Reguler"
                  value={stats.reguler}
                  hint={`${stats.regulerPct}% dari total`}
                  percentage={stats.regulerPct}
                />
                <ProgressStatCard
                  horizontal
                  icon={Truck}
                  tone="green"
                  title="Paket Instant"
                  value={stats.instant}
                  hint={`${stats.instantPct}% dari total`}
                  percentage={stats.instantPct}
                />
                <ProgressStatCard
                  horizontal
                  icon={Wallet}
                  tone="orange"
                  title="COD"
                  value={stats.cod}
                  hint={`${stats.codPct}% dari total`}
                  percentage={stats.codPct}
                />
              </div>

              <SectionCard
                icon={ClipboardCheck}
                title="Status Pengiriman"
                description="Ringkasan status pengiriman."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {statusStats.map((s) => {
                    const meta = statusIcon[s.status];
                    return (
                      <ProgressStatCard
                        key={s.status}
                        icon={meta.icon}
                        tone={meta.tone}
                        title={s.status}
                        value={s.count}
                        hint={`${s.percentage}% dari total`}
                        percentage={s.percentage}
                      />
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard icon={SlidersHorizontal} title="Filter Data">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Cari Data
                    </Label>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                      <Input
                        placeholder="Cari nomor resi, penerima..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-11 rounded-lg border-slate-200 bg-white pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Filter Status
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Filter Jenis Paket
                    </Label>
                    <Select
                      value={packageTypeFilter}
                      onValueChange={setPackageTypeFilter}
                    >
                      <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PACKAGE_TYPE_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!hasFilter}
                      onClick={resetFilter}
                      className="h-11 w-full gap-2 rounded-lg border-slate-200"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      Reset Filter
                    </Button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={ClipboardListIcon}
                title="Data Pengiriman"
                description={`${filteredData.length} entri`}
              >
                <DataTable
                  columns={columns}
                  data={filteredData}
                  hasFilter={hasFilter}
                />
              </SectionCard>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LaporanPengiriman;

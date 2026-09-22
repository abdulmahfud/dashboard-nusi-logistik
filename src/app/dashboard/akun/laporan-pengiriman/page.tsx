"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatCard } from "@/components/redesign/stat-card";
import {
  DateRangeField,
  toApiDate,
} from "@/components/redesign/date-range-field";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah } from "@/lib/currency";
import { getUserShippingReport } from "@/lib/apiClient";
import type { ShippingActivityReport } from "@/types/laporanAktivitasPengiriman";
import { AxiosError } from "axios";
import { Activity, Loader2, Package, Truck, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

const accountTypeLabel: Record<string, string> = {
  personal: "Personal",
  corporate: "Corporate",
  agen: "Agen",
};

const headCls = "h-11 text-xs font-semibold text-slate-500";

export default function LaporanPengirimanSayaPage() {
  const { user, loading: authLoading } = useAuth();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [report, setReport] = useState<ShippingActivityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getUserShippingReport(user.id, {
      start_date: dateRange?.from ? toApiDate(dateRange.from) : undefined,
      end_date: dateRange?.to ? toApiDate(dateRange.to) : undefined,
    })
      .then((res) => setReport(res.data))
      .catch((err) => {
        setError(getErrorMessage(err, "Gagal memuat laporan pengiriman."));
        setReport(null);
      })
      .finally(() => setLoading(false));
  }, [user, dateRange]);

  if (authLoading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex min-h-[40vh] items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Memuat…</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Laporan Pengiriman Saya" },
            ]}
            icon={Activity}
            title="Laporan Pengiriman Saya"
            description="Ringkasan pengiriman akun Anda — total pengiriman, total ongkir, breakdown per vendor."
            action={
              <DateRangeField
                value={dateRange}
                onChange={setDateRange}
                placeholder="Semua periode"
                className="w-[240px]"
              />
            }
          />

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Memuat laporan…
            </div>
          ) : error ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : report ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                  {accountTypeLabel[report.user.account_type] ||
                    report.user.account_type}
                </span>
                <span className="text-sm text-slate-500">
                  Periode {report.period.start_date} s/d {report.period.end_date}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                  icon={Package}
                  tone="blue"
                  title="Total Pengiriman"
                  value={String(report.totals.total_shipments)}
                  hint="Pada periode ini"
                />
                <StatCard
                  icon={Wallet}
                  tone="green"
                  title="Total Ongkir"
                  value={formatRupiah(report.totals.total_ongkir)}
                  hint="Pada periode ini"
                />
              </div>

              <SectionCard icon={Truck} title="Breakdown per Vendor">
                {report.by_vendor.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Belum ada pengiriman di periode ini.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100 hover:bg-transparent">
                          <TableHead className={headCls}>Vendor</TableHead>
                          <TableHead className={headCls}>
                            Total Pengiriman
                          </TableHead>
                          <TableHead className={headCls}>
                            Total Ongkir
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.by_vendor.map((row) => (
                          <TableRow
                            key={row.vendor}
                            className="border-slate-100 hover:bg-slate-50/60"
                          >
                            <TableCell className="py-4">
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase text-blue-700">
                                {row.vendor}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-700">
                              {row.total_shipments}
                            </TableCell>
                            <TableCell className="py-4 text-sm font-medium text-slate-900">
                              {formatRupiah(row.total_ongkir)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </SectionCard>

              {report.credit && (
                <SectionCard icon={Wallet} title="Kredit Kerja Sama">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Limit Kredit</span>
                      <span className="font-medium text-slate-900">
                        {formatRupiah(report.credit.credit_limit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Outstanding</span>
                      <span className="text-slate-900">
                        {report.credit.max_outstanding != null
                          ? formatRupiah(report.credit.max_outstanding)
                          : "Sama dengan limit kredit"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Outstanding Saat Ini
                      </span>
                      <span className="font-semibold text-blue-700">
                        {formatRupiah(report.credit.outstanding_balance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Kredit Terpakai Periode Ini
                      </span>
                      <span className="font-semibold text-blue-700">
                        {formatRupiah(report.credit.credit_used_this_period)}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              )}
            </>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

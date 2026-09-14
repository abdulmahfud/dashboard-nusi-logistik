"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah } from "@/lib/currency";
import { getUserShippingReport } from "@/lib/apiClient";
import type { ShippingActivityReport } from "@/types/laporanAktivitasPengiriman";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { Activity, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "./date-picker-with-range";

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
      start_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                <Activity className="h-7 w-7 text-blue-600" />
                Laporan Pengiriman Saya
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Ringkasan pengiriman akun Anda — total pengiriman, total
                ongkir, breakdown per vendor.
              </p>
            </div>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
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
                <Badge variant="outline" className="capitalize">
                  {accountTypeLabel[report.user.account_type] ||
                    report.user.account_type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Periode {report.period.start_date} s/d {report.period.end_date}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">
                      Total Pengiriman
                    </p>
                    <p className="text-2xl font-semibold">
                      {report.totals.total_shipments}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">
                      Total Ongkir
                    </p>
                    <p className="text-2xl font-semibold">
                      {formatRupiah(report.totals.total_ongkir)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Breakdown per Vendor</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.by_vendor.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                      Belum ada pengiriman di periode ini.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Total Pengiriman</TableHead>
                            <TableHead>Total Ongkir</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.by_vendor.map((row) => (
                            <TableRow key={row.vendor}>
                              <TableCell>
                                <Badge variant="outline">{row.vendor}</Badge>
                              </TableCell>
                              <TableCell>{row.total_shipments}</TableCell>
                              <TableCell>
                                {formatRupiah(row.total_ongkir)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {report.credit && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kredit Kerja Sama</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Limit Kredit
                      </span>
                      <span className="font-medium">
                        {formatRupiah(report.credit.credit_limit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Max Outstanding
                      </span>
                      <span>
                        {report.credit.max_outstanding != null
                          ? formatRupiah(report.credit.max_outstanding)
                          : "Sama dengan limit kredit"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Outstanding Saat Ini
                      </span>
                      <span className="font-semibold text-blue-700">
                        {formatRupiah(report.credit.outstanding_balance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Kredit Terpakai Periode Ini
                      </span>
                      <span className="font-semibold text-blue-700">
                        {formatRupiah(report.credit.credit_used_this_period)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

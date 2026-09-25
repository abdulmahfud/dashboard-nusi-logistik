"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createExport, getUserShippingReport, getUsers } from "@/lib/apiClient";
import type { ShippingActivityReport } from "@/types/laporanAktivitasPengiriman";
import type { User } from "@/types/users";
import { AxiosError } from "axios";
import {
  Activity,
  Download,
  Loader2,
  Package,
  Search,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  const { user, loading: authLoading, hasPermission } = useAuth();
  const router = useRouter();
  const canExport = hasPermission("orders.index");
  // Yang boleh melihat semua akun boleh membatasi export ke satu akun.
  const canPickAccount = hasPermission("orders.view_all");

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportRange, setExportRange] = useState<DateRange | undefined>(
    undefined
  );
  const [accountQuery, setAccountQuery] = useState("");
  const [accountResults, setAccountResults] = useState<User[]>([]);
  const [searchingAccount, setSearchingAccount] = useState(false);
  const [exportAccount, setExportAccount] = useState<User | null>(null);
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

  useEffect(() => {
    if (!exportOpen || !canPickAccount || exportAccount) return;
    const q = accountQuery.trim();
    if (q.length < 3) {
      setAccountResults([]);
      return;
    }
    setSearchingAccount(true);
    const t = setTimeout(() => {
      getUsers({ search: q, per_page: 8 })
        .then((res) => setAccountResults(res.data.data))
        .catch(() => setAccountResults([]))
        .finally(() => setSearchingAccount(false));
    }, 300);
    return () => clearTimeout(t);
  }, [accountQuery, exportAccount, exportOpen, canPickAccount]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await createExport({
        type: "shipping-summary",
        start_date: exportRange?.from ? toApiDate(exportRange.from) : undefined,
        end_date: exportRange?.to
          ? toApiDate(exportRange.to)
          : exportRange?.from
            ? toApiDate(exportRange.from)
            : undefined,
        // Customer tidak boleh mengirim user_id (dibalas 422).
        user_id: canPickAccount && exportAccount ? exportAccount.id : undefined,
      });
      toast.success("Export sedang diproses.", {
        description: "Unduh filenya di halaman Download Report.",
      });
      setExportOpen(false);
      router.push("/dashboard/download-report");
    } catch (err) {
      const data =
        err instanceof AxiosError
          ? (err.response?.data as
              | { message?: string; errors?: Record<string, string[]> }
              | undefined)
          : undefined;
      const first = data?.errors ? Object.values(data.errors).flat()[0] : null;
      toast.error(first || data?.message || "Gagal membuat export.");
    } finally {
      setExporting(false);
    }
  };

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
              <div className="flex flex-wrap items-center gap-2">
                <DateRangeField
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Semua periode"
                  className="w-[240px]"
                />
                {canExport && (
                  <Button
                    type="button"
                    className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setExportRange(dateRange);
                      setExportAccount(null);
                      setAccountQuery("");
                      setAccountResults([]);
                      setExportOpen(true);
                    }}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Export
                  </Button>
                )}
              </div>
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

        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Download className="h-5 w-5" aria-hidden />
                </span>
                <div className="text-left">
                  <DialogTitle>Export Ringkasan Pengiriman</DialogTitle>
                  <DialogDescription>
                    Pilih rentang tanggal order dibuat. Kosongkan untuk semua
                    waktu.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <DateRangeField
              value={exportRange}
              onChange={setExportRange}
              placeholder="Semua waktu"
            />
            {canPickAccount ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Akun (opsional)
                </Label>
                {exportAccount ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="truncate">
                      {exportAccount.name} ({exportAccount.email})
                    </span>
                    <button
                      type="button"
                      aria-label="Hapus pilihan akun"
                      className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200"
                      onClick={() => {
                        setExportAccount(null);
                        setAccountQuery("");
                      }}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Cari nama/email (min. 3 huruf), kosong = semua akun"
                      value={accountQuery}
                      onChange={(e) => setAccountQuery(e.target.value)}
                      autoComplete="off"
                      className="h-11 rounded-lg border-slate-200 bg-white pr-9"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {searchingAccount ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </div>
                    {accountResults.length > 0 && (
                      <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {accountResults.map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            className="block w-full border-b border-slate-100 p-3 text-left last:border-b-0 hover:bg-blue-50"
                            onClick={() => {
                              setExportAccount(u);
                              setAccountResults([]);
                            }}
                          >
                            <p className="text-sm font-medium text-slate-900">
                              {u.name}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Export berisi ringkasan order akun Anda sendiri.
              </p>
            )}
            <p className="text-xs text-slate-400">
              File dibuat di latar belakang, lalu bisa diunduh di halaman
              Download Report.
            </p>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
                onClick={() => setExportOpen(false)}
                disabled={exporting}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => void handleExport()}
                disabled={exporting}
              >
                {exporting && <Loader2 className="h-4 w-4 animate-spin" />}
                Buat Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

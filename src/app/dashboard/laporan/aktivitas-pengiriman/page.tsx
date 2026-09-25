"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

const headCls = "h-11 text-xs font-semibold text-slate-500";

export default function AktivitasPengirimanPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  // Pencarian & pemilihan user
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [searchingUser, setSearchingUser] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const userInputRef = useRef<HTMLDivElement>(null);
  // Penomoran request pencarian — biar respons yang datang belakangan tidak
  // pernah ditimpa oleh respons lama yang baru sampai duluan (race condition).
  const searchSeqRef = useRef(0);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportRange, setExportRange] = useState<DateRange | undefined>(
    undefined
  );
  const [exportOnlySelected, setExportOnlySelected] = useState(true);

  const [report, setReport] = useState<ShippingActivityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !hasPermission("reports.shipping.view")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userInputRef.current &&
        !userInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runUserSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setUserResults([]);
      return;
    }
    const seq = ++searchSeqRef.current;
    setSearchingUser(true);
    getUsers({ search: trimmed, per_page: 10 })
      .then((res) => {
        if (seq !== searchSeqRef.current) return; // respons basi, abaikan
        setUserResults(res.data.data);
        setShowResults(true);
      })
      .catch(() => {
        if (seq !== searchSeqRef.current) return;
        setUserResults([]);
      })
      .finally(() => {
        if (seq === searchSeqRef.current) setSearchingUser(false);
      });
  }, []);

  useEffect(() => {
    if (userQuery.trim().length < 3 || selectedUser) {
      setUserResults([]);
      return;
    }
    const t = setTimeout(() => runUserSearch(userQuery), 300);
    return () => clearTimeout(t);
  }, [userQuery, selectedUser, runUserSearch]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setUserQuery(`${user.name} (${user.email})`);
    setShowResults(false);
    setReport(null);
  };

  const fetchReport = async (userId: number, range?: DateRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserShippingReport(userId, {
        start_date: range?.from ? toApiDate(range.from) : undefined,
        end_date: range?.to ? toApiDate(range.to) : undefined,
      });
      setReport(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat laporan aktivitas."));
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await createExport({
        type: "shipping-activity",
        start_date: exportRange?.from ? toApiDate(exportRange.from) : undefined,
        end_date: exportRange?.to
          ? toApiDate(exportRange.to)
          : exportRange?.from
            ? toApiDate(exportRange.from)
            : undefined,
        user_id:
          selectedUser && exportOnlySelected ? selectedUser.id : undefined,
      });
      toast.success("Export sedang diproses.", {
        description: "Unduh filenya di halaman Download Report.",
      });
      setExportOpen(false);
      router.push("/dashboard/download-report");
    } catch (err) {
      const data =
        err instanceof AxiosError
          ? (err.response?.data as {
              message?: string;
              errors?: Record<string, string[]>;
            })
          : undefined;
      const first = data?.errors ? Object.values(data.errors).flat()[0] : null;
      toast.error(first || data?.message || "Gagal membuat export.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      void fetchReport(selectedUser.id, dateRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, dateRange]);

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

  if (!hasPermission("reports.shipping.view")) return null;

  const accountTypeLabel: Record<string, string> = {
    personal: "Personal",
    corporate: "Corporate",
    agen: "Agen",
  };

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
              { label: "Aktivitas Pengiriman" },
            ]}
            icon={Activity}
            title="Aktivitas Pengiriman"
            description="Ringkasan pengiriman satu akun dalam satu periode — total pengiriman, total ongkir, dan breakdown per vendor."
            action={
              <Button
                type="button"
                className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setExportRange(dateRange);
                  setExportOnlySelected(true);
                  setExportOpen(true);
                }}
              >
                <Download className="h-4 w-4" aria-hidden />
                Export
              </Button>
            }
          />

          <SectionCard icon={Search} title="Pilih Akun & Periode">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="relative" ref={userInputRef}>
                <Label className="text-sm font-medium text-slate-700" htmlFor="user-search">
                  Cari user (nama/email)
                </Label>
                <div className="mt-1 flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="user-search"
                      placeholder="Ketik minimal 3 huruf, lalu Enter atau klik cari…"
                      value={userQuery}
                      onChange={(e) => {
                        setUserQuery(e.target.value);
                        setSelectedUser(null);
                        setReport(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          runUserSearch(userQuery);
                        }
                      }}
                      autoComplete="off"
                      className="h-11 rounded-lg border-slate-200 bg-white"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => runUserSearch(userQuery)}
                    disabled={searchingUser}
                    className="h-11 w-11 shrink-0 rounded-lg border-slate-200 p-0"
                  >
                    {searchingUser ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {showResults && userResults.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {userResults.map((u) => (
                      <div
                        key={u.id}
                        className="cursor-pointer border-b border-slate-100 p-3 last:border-b-0 hover:bg-blue-50"
                        onClick={() => handleSelectUser(u)}
                      >
                        <p className="text-sm font-medium text-slate-900">
                          {u.name}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <p className="mt-2 text-sm text-emerald-700">
                    Terpilih: {selectedUser.name} ({selectedUser.email})
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">
                  Periode (opsional)
                </Label>
                <div className="mt-1">
                  <DateRangeField
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Bulan berjalan"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Kosongkan untuk default bulan berjalan.
                </p>
              </div>
            </div>
          </SectionCard>

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
                <SectionCard icon={Wallet} title="Kredit (Akun Corporate)">
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
                    <p className="pt-2 text-xs text-slate-400">
                      Total Ongkir di atas memakai nilai kutipan saat order
                      dibuat, sedangkan Kredit Terpakai/Outstanding bersumber
                      dari ledger kredit (ikut mencerminkan koreksi berat/nilai
                      setelah order berjalan) — selisih di antara keduanya
                      bukan berarti kesalahan data.
                    </p>
                  </div>
                </SectionCard>
              )}
            </>
          ) : selectedUser ? null : (
            <p className="py-8 text-center text-sm text-slate-500">
              Pilih user untuk melihat laporan aktivitas pengirimannya.
            </p>
          )}
        </div>
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Download className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <DialogTitle>Export Aktivitas Pengiriman</DialogTitle>
                  <DialogDescription>
                    Pilih rentang tanggal order dibuat. Kosongkan untuk semua
                    data.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <DateRangeField
              value={exportRange}
              onChange={setExportRange}
              placeholder="Semua data"
            />
            {selectedUser ? (
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                <Checkbox
                  checked={exportOnlySelected}
                  onCheckedChange={(v) => setExportOnlySelected(v === true)}
                  className="mt-0.5"
                />
                <span>
                  Hanya akun <strong>{selectedUser.name}</strong> (
                  {selectedUser.email}). Hilangkan centang untuk semua akun.
                </span>
              </label>
            ) : (
              <p className="text-xs text-slate-500">
                Tidak ada akun dipilih, jadi export mencakup semua akun.
              </p>
            )}
            <p className="text-xs text-slate-400">
              File dibuat di latar belakang lalu bisa diunduh di halaman
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

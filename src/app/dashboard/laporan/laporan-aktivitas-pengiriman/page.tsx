"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { getUserShippingReport, getUsers } from "@/lib/apiClient";
import type { ShippingActivityReport } from "@/types/laporanAktivitasPengiriman";
import type { User } from "@/types/users";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { Activity, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "./date-picker-with-range";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

export default function LaporanAktivitasPengirimanPage() {
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
        start_date: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
        end_date: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
      });
      setReport(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat laporan aktivitas."));
      setReport(null);
    } finally {
      setLoading(false);
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
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <Activity className="h-7 w-7 text-blue-600" />
              Aktivitas Pengiriman per Akun
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Ringkasan pengiriman satu akun dalam satu periode — total
              pengiriman, total ongkir, dan breakdown per vendor.
            </p>
          </div>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Pilih Akun & Periode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative" ref={userInputRef}>
                  <label className="text-sm font-medium" htmlFor="user-search">
                    Cari user (nama/email)
                  </label>
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
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => runUserSearch(userQuery)}
                      disabled={searchingUser}
                    >
                      {searchingUser ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {showResults && userResults.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                      {userResults.map((u) => (
                        <div
                          key={u.id}
                          className="cursor-pointer border-b p-3 last:border-b-0 hover:bg-blue-50"
                          onClick={() => handleSelectUser(u)}
                        >
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <p className="mt-2 text-sm text-green-700">
                      Terpilih: {selectedUser.name} ({selectedUser.email})
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Periode (opsional)
                  </label>
                  <div className="mt-1">
                    <DatePickerWithRange
                      date={dateRange}
                      setDate={setDateRange}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kosongkan untuk default bulan berjalan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <CardTitle className="text-lg">
                      Kredit (Akun Corporate)
                    </CardTitle>
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
                    <p className="pt-2 text-xs text-muted-foreground">
                      Total Ongkir di atas memakai nilai kutipan saat order
                      dibuat, sedangkan Kredit Terpakai/Outstanding bersumber
                      dari ledger kredit (ikut mencerminkan koreksi berat/nilai
                      setelah order berjalan) — selisih di antara keduanya
                      bukan berarti kesalahan data.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : selectedUser ? null : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Pilih user untuk melihat laporan aktivitas pengirimannya.
            </p>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

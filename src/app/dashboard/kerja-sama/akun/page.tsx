"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getKerjaSamaAccounts } from "@/lib/apiClient";
import type { KerjaSamaAccount } from "@/types/kerjaSama";
import { AxiosError } from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Handshake,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function KerjaSamaAkunPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<KerjaSamaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchList = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getKerjaSamaAccounts({
          page: targetPage,
          search: search || undefined,
          account_type:
            accountType === "all"
              ? undefined
              : (accountType as "personal" | "corporate"),
          kerja_sama_is_active:
            activeFilter === "all" ? undefined : activeFilter === "1" ? 1 : 0,
        });
        setRows(res.data.data);
        setPage(res.data.current_page);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
      } catch (err) {
        const msg =
          err instanceof AxiosError
            ? (err.response?.data as { message?: string })?.message
            : undefined;
        setError(msg || "Gagal memuat daftar akun kerja sama.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, accountType, activeFilter]
  );

  useEffect(() => {
    if (!authLoading && !hasPermission("kerja-sama.accounts.view")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!authLoading && hasPermission("kerja-sama.accounts.view")) {
      void fetchList(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, hasPermission, accountType, activeFilter]);

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

  if (!hasPermission("kerja-sama.accounts.view")) {
    return null;
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
                <Handshake className="h-7 w-7 text-blue-600" />
                Akun Kerja Sama
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Kelola akun postpaid (bayar via invoice bulanan berdasarkan
                limit kredit).
              </p>
            </div>
            {hasPermission("kerja-sama.accounts.create") && (
              <Button
                type="button"
                className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => router.push("/dashboard/kerja-sama/akun/create")}
              >
                <Plus className="h-4 w-4" />
                Aktifkan Akun Kerja Sama
              </Button>
            )}
          </div>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Daftar akun</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex flex-1 gap-2">
                  <Input
                    placeholder="Cari nama, email, nama perusahaan…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchList(1)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchList(1)}
                    disabled={loading}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Tipe Akun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="1">Aktif</SelectItem>
                    <SelectItem value="0">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fetchList(page)}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memuat data…
                </div>
              ) : error ? (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </div>
              ) : rows.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Belum ada akun kerja sama.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Tipe Akun</TableHead>
                          <TableHead>Limit Kredit</TableHead>
                          <TableHead>Tanggal Tagih</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell>
                              <p className="font-medium">
                                {acc.company_name || acc.name}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {acc.email}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {acc.account_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap tabular-nums">
                              {formatRupiah(acc.credit_limit)}
                            </TableCell>
                            <TableCell>
                              Tgl. {acc.billing_due_day}
                            </TableCell>
                            <TableCell>
                              {acc.kerja_sama_is_active ? (
                                <Badge className="border-green-200 bg-green-100 text-green-800">
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge className="border-red-200 bg-red-100 text-red-800">
                                  Nonaktif
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/kerja-sama/akun/${acc.id}`
                                  )
                                }
                              >
                                <Eye className="h-4 w-4" />
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
                    <span>
                      Halaman {page} dari {lastPage} · Total {total} akun
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchList(page - 1)}
                        disabled={page <= 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchList(page + 1)}
                        disabled={page >= lastPage || loading}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

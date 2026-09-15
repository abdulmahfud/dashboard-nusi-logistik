"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
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
import { getAgenAccounts } from "@/lib/apiClient";
import type { AgenAccount } from "@/types/agenAkun";
import { AxiosError } from "axios";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AgenAkunPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<AgenAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchList = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAgenAccounts({
          page: targetPage,
          per_page: perPage,
          search: search || undefined,
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
        setError(msg || "Gagal memuat daftar akun agen.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, perPage]
  );

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
  };

  useEffect(() => {
    if (!authLoading && !hasPermission("agen-accounts.view")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!authLoading && hasPermission("agen-accounts.view")) {
      void fetchList(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, hasPermission, perPage]);

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

  if (!hasPermission("agen-accounts.view")) {
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
                <Store className="h-7 w-7 text-blue-600" />
                Akun Agen
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Kelola akun agen (prepaid, bayar order via saldo wallet).
              </p>
            </div>
            {hasPermission("agen-accounts.create") && (
              <Button
                type="button"
                className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => router.push("/dashboard/agen/akun/create")}
              >
                <Plus className="h-4 w-4" />
                Aktifkan Akun Agen
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
                  Belum ada akun agen.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Perusahaan</TableHead>
                          <TableHead>PIC</TableHead>
                          <TableHead>Kontak Penagihan</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell>
                              <p className="font-medium">{acc.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {acc.email}
                              </p>
                            </TableCell>
                            <TableCell>
                              {acc.company_name || "—"}
                            </TableCell>
                            <TableCell>{acc.pic_name || "—"}</TableCell>
                            <TableCell>
                              {acc.pic_penagihan_name || "—"}
                              {acc.pic_penagihan_phone
                                ? ` (${acc.pic_penagihan_phone})`
                                : ""}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() =>
                                  router.push(`/dashboard/agen/akun/${acc.id}`)
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

                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-muted-foreground">
                      Total {total} akun
                    </span>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Baris per halaman</p>
                        <Select
                          value={`${perPage}`}
                          onValueChange={handlePerPageChange}
                        >
                          <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={perPage} />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((size) => (
                              <SelectItem key={size} value={`${size}`}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Halaman {page} dari {lastPage}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => fetchList(1)}
                          disabled={page <= 1 || loading}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => fetchList(page - 1)}
                          disabled={page <= 1 || loading}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => fetchList(page + 1)}
                          disabled={page >= lastPage || loading}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => fetchList(lastPage)}
                          disabled={page >= lastPage || loading}
                        >
                          <span className="sr-only">Go to last page</span>
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
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

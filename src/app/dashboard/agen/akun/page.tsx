"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { useAuth } from "@/context/AuthContext";
import { getAgenAccounts } from "@/lib/apiClient";
import type { AgenAccount } from "@/types/agenAkun";
import { AxiosError } from "axios";
import { Eye, Loader2, Plus, RefreshCw, Search, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const headCls = "h-11 text-xs font-semibold text-slate-500";

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

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Akun Agen" },
            ]}
            icon={Store}
            title="Akun Agen"
            description="Kelola akun agen (prepaid, bayar order via saldo wallet)."
            action={
              hasPermission("agen-accounts.create") ? (
                <Button
                  type="button"
                  className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push("/dashboard/agen/akun/create")}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Aktifkan Akun Agen
                </Button>
              ) : undefined
            }
          />

          <SectionCard icon={Search} title="Daftar Akun">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    placeholder="Cari nama, email, nama perusahaan…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchList(1)}
                    className="h-11 rounded-lg border-slate-200 bg-white pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchList(1)}
                  disabled={loading}
                  className="h-11 w-11 shrink-0 rounded-lg border-slate-200 p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 rounded-lg border-slate-200"
                onClick={() => fetchList(page)}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
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
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada akun agen.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className={headCls}>Nama</TableHead>
                        <TableHead className={headCls}>Perusahaan</TableHead>
                        <TableHead className={headCls}>PIC</TableHead>
                        <TableHead className={headCls}>
                          Kontak Penagihan
                        </TableHead>
                        <TableHead className={`${headCls} text-right`}>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((acc) => (
                        <TableRow
                          key={acc.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4">
                            <p className="font-medium text-slate-900">
                              {acc.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {acc.email}
                            </p>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700">
                            {acc.company_name || "—"}
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700">
                            {acc.pic_name || "—"}
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700">
                            {acc.pic_penagihan_name || "—"}
                            {acc.pic_penagihan_phone
                              ? ` (${acc.pic_penagihan_phone})`
                              : ""}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-9 gap-1.5 rounded-lg border-slate-200"
                              onClick={() =>
                                router.push(`/dashboard/agen/akun/${acc.id}`)
                              }
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <NumberedPagination
                  page={page}
                  lastPage={lastPage}
                  total={total}
                  perPage={perPage}
                  disabled={loading}
                  onPageChange={(p) => void fetchList(p)}
                  onPerPageChange={handlePerPageChange}
                />
              </div>
            )}
          </SectionCard>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

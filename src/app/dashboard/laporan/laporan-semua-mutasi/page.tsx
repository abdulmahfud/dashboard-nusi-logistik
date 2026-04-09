"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { getAllPayments } from "@/lib/apiClient";
import type { PaymentAllItem } from "@/types/payment";
import { formatDateIdLong } from "@/lib/date";
import { ClipboardListIcon, Loader2, RefreshCw } from "lucide-react";

type FilterState = {
  user_id: string;
  status: string;
  payment_method: string;
  date_from: string;
  date_to: string;
  amount_min: string;
  amount_max: string;
  reference_no: string;
};

const initialFilters: FilterState = {
  user_id: "",
  status: "all",
  payment_method: "all",
  date_from: "",
  date_to: "",
  amount_min: "",
  amount_max: "",
  reference_no: "",
};

function formatAmount(value: number | string | undefined): string {
  const n =
    typeof value === "string" ? Number(value.replace(/,/g, "")) : Number(value);
  if (!Number.isFinite(n)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function LaporanSemuaMutasiPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const canViewAll = hasPermission("payments.view_all");

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [rows, setRows] = useState<PaymentAllItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!canViewAll) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAllPayments({
        user_id: filters.user_id ? Number(filters.user_id) : undefined,
        status: filters.status === "all" ? undefined : filters.status,
        payment_method:
          filters.payment_method === "all" ? undefined : filters.payment_method,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        amount_min: filters.amount_min ? Number(filters.amount_min) : undefined,
        amount_max: filters.amount_max ? Number(filters.amount_max) : undefined,
        reference_no: filters.reference_no || undefined,
        per_page: 100,
      });
      setRows((res.data ?? []) as PaymentAllItem[]);
    } catch (e) {
      if (e instanceof AxiosError) {
        const msg = (e.response?.data as { message?: string })?.message;
        setError(msg || "Gagal memuat laporan semua mutasi.");
      } else {
        setError("Gagal memuat laporan semua mutasi.");
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && canViewAll) {
      void loadData();
    }
  }, [authLoading, canViewAll]);

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

  if (!canViewAll) return null;

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
          <div className="flex items-center gap-2">
            <ClipboardListIcon className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Laporan Semua Mutasi
              </h1>
              <p className="text-muted-foreground text-sm">
                Riwayat semua pembayaran dengan filter admin.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Input
                  placeholder="User ID"
                  value={filters.user_id}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      user_id: e.target.value.replace(/[^\d]/g, ""),
                    }))
                  }
                />
                <Select
                  value={filters.status}
                  onValueChange={(v) => setFilters((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.payment_method}
                  onValueChange={(v) =>
                    setFilters((p) => ({ ...p, payment_method: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Metode bayar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua metode</SelectItem>
                    <SelectItem value="xendit">Xendit</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="cod">COD</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Reference no"
                  value={filters.reference_no}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, reference_no: e.target.value }))
                  }
                />
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, date_from: e.target.value }))
                  }
                />
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, date_to: e.target.value }))
                  }
                />
                <Input
                  placeholder="Amount min"
                  value={filters.amount_min}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      amount_min: e.target.value.replace(/[^\d]/g, ""),
                    }))
                  }
                />
                <Input
                  placeholder="Amount max"
                  value={filters.amount_max}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      amount_max: e.target.value.replace(/[^\d]/g, ""),
                    }))
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void loadData()}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    "Terapkan Filter"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFilters(initialFilters);
                    setTimeout(() => void loadData(), 0);
                  }}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadData()}
                  disabled={loading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Mutasi ({rows.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : rows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada data untuk filter ini.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ref</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={`${row.id ?? row.reference_no ?? i}`}>
                          <TableCell className="font-mono text-xs">
                            {row.reference_no || "-"}
                          </TableCell>
                          <TableCell>
                            {row.user?.name || "-"}
                            {row.user?.email ? (
                              <div className="text-xs text-muted-foreground">
                                {row.user.email}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>{row.payment_method || "-"}</TableCell>
                          <TableCell>{row.status || "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatAmount(row.amount)}
                          </TableCell>
                          <TableCell>
                            {formatDateIdLong(row.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


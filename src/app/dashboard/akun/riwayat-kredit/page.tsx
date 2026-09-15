"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDateIdLong } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import { getKerjaSamaLedger } from "@/lib/apiClient";
import {
  KERJA_SAMA_LEDGER_STATUS_LABEL,
  KERJA_SAMA_LEDGER_TYPE_LABEL,
  type KerjaSamaLedgerEntry,
} from "@/types/kerjaSama";
import { AxiosError } from "axios";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

export default function RiwayatKreditSayaPage() {
  const { user, loading: authLoading } = useAuth();

  const [ledger, setLedger] = useState<KerjaSamaLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [outstanding, setOutstanding] = useState<number | null>(null);

  const fetchLedger = useCallback(
    async (targetPage = 1) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getKerjaSamaLedger(user.id, {
          page: targetPage,
          per_page: perPage,
          type: type === "all" ? undefined : type,
          status: status === "all" ? undefined : status,
        });
        setLedger(res.data.data);
        setPage(res.data.current_page);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
        setOutstanding(res.outstanding_balance);
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat riwayat transaksi."));
        setLedger([]);
      } finally {
        setLoading(false);
      }
    },
    [user, type, status, perPage]
  );

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
  };

  useEffect(() => {
    void fetchLedger(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, type, status, perPage]);

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
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <CreditCard className="h-7 w-7 text-blue-600" />
              Riwayat Transaksi Kredit Saya
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Khusus akun kerja sama (corporate) — riwayat tagihan dan
              pembayaran yang memengaruhi limit kredit Anda.
            </p>
          </div>

          {outstanding != null && (
            <Card className="border-blue-100 shadow-sm">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">
                  Outstanding Saat Ini
                </p>
                <p className="text-2xl font-semibold text-blue-700">
                  {formatRupiah(outstanding)}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Riwayat Transaksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="charge">Tagihan</SelectItem>
                    <SelectItem value="adjustment">Penyesuaian</SelectItem>
                    <SelectItem value="payment">Pembayaran</SelectItem>
                    <SelectItem value="write_off">Hapus Buku</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Belum Sampai</SelectItem>
                    <SelectItem value="confirmed">Terkonfirmasi</SelectItem>
                    <SelectItem value="invoiced">Sudah Ditagih</SelectItem>
                    <SelectItem value="voided">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memuat…
                </div>
              ) : error ? (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </div>
              ) : ledger.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Belum ada transaksi kredit.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Nominal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledger.map((entry) => {
                          const amount = Number(entry.amount);
                          const isNegative = amount < 0;
                          return (
                            <TableRow key={entry.id}>
                              <TableCell className="whitespace-nowrap text-sm">
                                {formatDateIdLong(entry.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {KERJA_SAMA_LEDGER_TYPE_LABEL[entry.type] ??
                                    entry.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[280px] truncate text-sm">
                                {entry.description || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {KERJA_SAMA_LEDGER_STATUS_LABEL[
                                    entry.status
                                  ] ?? entry.status}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`text-right font-medium tabular-nums ${
                                  isNegative ? "text-green-700" : "text-red-700"
                                }`}
                              >
                                {isNegative ? "-" : "+"}
                                {formatRupiah(Math.abs(amount))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-muted-foreground">
                      Total {total} transaksi
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
                          onClick={() => fetchLedger(1)}
                          disabled={page <= 1 || loading}
                        >
                          <span className="sr-only">Go to first page</span>
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => fetchLedger(page - 1)}
                          disabled={page <= 1 || loading}
                        >
                          <span className="sr-only">Go to previous page</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => fetchLedger(page + 1)}
                          disabled={page >= lastPage || loading}
                        >
                          <span className="sr-only">Go to next page</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="hidden h-8 w-8 p-0 lg:flex"
                          onClick={() => fetchLedger(lastPage)}
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

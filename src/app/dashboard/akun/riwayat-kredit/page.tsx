"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
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
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatCard } from "@/components/redesign/stat-card";
import { StatusBadge } from "@/components/redesign/status-badge";
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
  CreditCard,
  Download,
  Loader2,
  ReceiptText,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ExportLedgerDialog from "./export-ledger-dialog";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

const headCls = "h-11 text-xs font-semibold text-slate-500";
const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";

/** Status ledger → StatusBadge: voided = gagal, confirmed = sukses, sisanya sesuai maknanya. */
function ledgerStatusBadge(status: string) {
  const label =
    KERJA_SAMA_LEDGER_STATUS_LABEL[
      status as keyof typeof KERJA_SAMA_LEDGER_STATUS_LABEL
    ] ?? status;
  const tone =
    status === "confirmed"
      ? "success"
      : status === "pending"
        ? "pending"
        : status === "voided"
          ? "failed"
          : "neutral";
  return <StatusBadge status={tone} label={label} />;
}

export default function RiwayatKreditSayaPage() {
  const { user, loading: authLoading, hasPermission } = useAuth();
  // Boleh export bila punya salah satu; pemilihan akun hanya untuk pemegang `.view`.
  const canPickAccount = hasPermission("kerja-sama.accounts.view");
  const canExport =
    canPickAccount || hasPermission("kerja-sama.accounts.view-own");

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
  const [exportOpen, setExportOpen] = useState(false);

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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Riwayat Transaksi Kredit Saya" },
            ]}
            icon={CreditCard}
            title="Riwayat Transaksi Kredit Saya"
            description="Khusus akun kerja sama (corporate) — riwayat tagihan dan pembayaran yang memengaruhi limit kredit Anda."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 rounded-lg border-slate-200 bg-white"
                  onClick={() => void fetchLedger(page)}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  Muat Ulang
                </Button>
                {canExport && (
                  <Button
                    type="button"
                    className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                    onClick={() => setExportOpen(true)}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Export
                  </Button>
                )}
              </div>
            }
          />

          {outstanding != null && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Wallet}
                tone="blue"
                title="Outstanding Saat Ini"
                value={formatRupiah(outstanding)}
                hint="Tagihan kredit yang belum dilunasi"
              />
            </div>
          )}

          <SectionCard
            icon={ReceiptText}
            title="Riwayat Transaksi"
            description={
              !loading && !error ? `${total} transaksi ditemukan` : undefined
            }
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger
                  aria-label="Filter tipe"
                  className={`w-full sm:w-[200px] ${fieldCls}`}
                >
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
                <SelectTrigger
                  aria-label="Filter status"
                  className={`w-full sm:w-[200px] ${fieldCls}`}
                >
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
              <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
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
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada transaksi kredit.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className={headCls}>Tanggal</TableHead>
                      <TableHead className={headCls}>Tipe</TableHead>
                      <TableHead className={headCls}>Deskripsi</TableHead>
                      <TableHead className={headCls}>Status</TableHead>
                      <TableHead className={`${headCls} text-right`}>
                        Nominal
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.map((entry) => {
                      const amount = Number(entry.amount);
                      const isNegative = amount < 0;
                      return (
                        <TableRow
                          key={entry.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                            {formatDateIdLong(entry.created_at)}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {KERJA_SAMA_LEDGER_TYPE_LABEL[entry.type] ??
                                entry.type}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[280px] truncate py-4 text-sm text-slate-700">
                            {entry.description || "—"}
                          </TableCell>
                          <TableCell className="py-4">
                            {ledgerStatusBadge(entry.status)}
                          </TableCell>
                          <TableCell
                            className={`py-4 text-right text-sm font-semibold tabular-nums ${
                              isNegative ? "text-emerald-700" : "text-rose-700"
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

                <NumberedPagination
                  className="mt-2"
                  page={page}
                  lastPage={lastPage}
                  total={total}
                  perPage={perPage}
                  disabled={loading}
                  onPageChange={(p) => void fetchLedger(p)}
                  onPerPageChange={setPerPage}
                />
              </div>
            )}
          </SectionCard>
        </div>

        {canExport && (
          <ExportLedgerDialog
            open={exportOpen}
            onOpenChange={setExportOpen}
            canPickAccount={canPickAccount}
            initialType={type}
            initialStatus={status}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

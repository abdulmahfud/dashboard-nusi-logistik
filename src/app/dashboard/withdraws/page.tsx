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
import { StatusBadge } from "@/components/redesign/status-badge";
import { useAuth } from "@/context/AuthContext";
import {
  approveWithdraw,
  getWithdraws,
  getWithdrawsPaginatorMeta,
  normalizeWithdrawRecords,
  rejectWithdraw,
} from "@/lib/apiClient";
import type { WithdrawRecord } from "@/types/wallet";
import { AxiosError } from "axios";
import {
  ArrowDownToLine,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ExportWithdrawsDialog from "./export-withdraws-dialog";

function formatIdr(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  const n =
    typeof value === "string"
      ? parseFloat(String(value).replace(/,/g, ""))
      : Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

const headCls = "h-11 text-xs font-semibold text-slate-500";

function statusBadge(status: string | undefined) {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "success" || s === "completed") {
    return <StatusBadge status="success" label="Disetujui" />;
  }
  if (s === "rejected" || s === "failed" || s === "cancelled") {
    return <StatusBadge status="failed" label="Ditolak" />;
  }
  return <StatusBadge status="pending" label="Menunggu" />;
}

export default function WithdrawsAdminPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();
  const canExport = hasPermission("exports.withdraws");
  const [exportOpen, setExportOpen] = useState(false);

  const [rows, setRows] = useState<WithdrawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | number | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<WithdrawRecord | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchList = useCallback(
    async (targetPage = 1, perPageOverride = perPage) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getWithdraws({
          page: targetPage,
          per_page: perPageOverride,
        });
        const records = normalizeWithdrawRecords(res);
        setRows(records);
        const meta = getWithdrawsPaginatorMeta(res);
        if (meta) {
          setPage(meta.current_page);
          setLastPage(meta.last_page);
          setTotal(meta.total);
        } else {
          setPage(1);
          setLastPage(1);
          setTotal(records.length);
        }
      } catch (err) {
        if (err instanceof AxiosError) {
          const msg = (err.response?.data as { message?: string })?.message;
          setError(msg || "Gagal memuat daftar withdraw.");
        } else {
          setError("Gagal memuat daftar withdraw.");
        }
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perPage]
  );

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
  };

  useEffect(() => {
    if (!authLoading && !hasPermission("withdraws.update")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!authLoading && hasPermission("withdraws.update")) {
      void fetchList(1, perPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, hasPermission, perPage]);

  const handleApprove = async (row: WithdrawRecord) => {
    setActionId(row.id);
    try {
      const res = await approveWithdraw(row.id);
      toast.success(res.message || "Withdraw disetujui.");
      await fetchList(page, perPage);
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = (err.response?.data as { message?: string })?.message;
        toast.error(msg || "Gagal menyetujui withdraw.");
      } else {
        toast.error("Gagal menyetujui withdraw.");
      }
    } finally {
      setActionId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    try {
      const res = await rejectWithdraw(rejectTarget.id);
      toast.success(res.message || "Withdraw ditolak.");
      setRejectOpen(false);
      setRejectTarget(null);
      await fetchList(page, perPage);
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = (err.response?.data as { message?: string })?.message;
        toast.error(msg || "Gagal menolak withdraw.");
      } else {
        toast.error("Gagal menolak withdraw.");
      }
    } finally {
      setActionId(null);
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

  if (!hasPermission("withdraws.update")) {
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
              { label: "Permintaan Withdraw" },
            ]}
            icon={ArrowDownToLine}
            title="Permintaan Withdraw"
            description="Tinjau dan setujui atau tolak pengajuan penarikan saldo."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 rounded-lg border-slate-200 bg-white"
                  onClick={() => void fetchList(page, perPage)}
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

          <SectionCard
            icon={ArrowDownToLine}
            title="Daftar Pengajuan"
            description={
              !loading && !error ? `${total} pengajuan ditemukan` : undefined
            }
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
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
                Belum ada pengajuan withdraw.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className={`${headCls} w-[90px]`}>ID</TableHead>
                      <TableHead className={headCls}>Pengguna</TableHead>
                      <TableHead className={headCls}>Nominal</TableHead>
                      <TableHead className={headCls}>Rekening</TableHead>
                      <TableHead className={headCls}>Status</TableHead>
                      <TableHead className={headCls}>Tanggal</TableHead>
                      <TableHead className={`${headCls} text-right`}>
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const pending =
                        !row.status ||
                        String(row.status).toLowerCase() === "pending";
                      const busy = actionId === row.id;
                      return (
                        <TableRow
                          key={String(row.id)}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4 font-mono text-sm text-slate-700">
                            {String(row.id)}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="max-w-[200px]">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {row.user?.name ?? "—"}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {row.user?.email ?? ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm font-semibold tabular-nums text-slate-900">
                            {formatIdr(row.amount)}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="max-w-[220px]">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {row.bank_account?.bank_name ?? "—"}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {row.bank_account?.account_number ?? ""}{" "}
                                {row.bank_account?.account_name
                                  ? `· ${row.bank_account.account_name}`
                                  : ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {statusBadge(row.status)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm text-slate-600">
                            {row.created_at
                              ? new Date(row.created_at).toLocaleString("id-ID")
                              : "—"}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            {pending ? (
                              <div className="flex flex-wrap justify-end gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-9 gap-1.5 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  disabled={busy}
                                  onClick={() => void handleApprove(row)}
                                >
                                  {busy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2
                                      className="h-3.5 w-3.5"
                                      aria-hidden
                                    />
                                  )}
                                  Setujui
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-9 gap-1.5 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
                                  disabled={busy}
                                  onClick={() => {
                                    setRejectTarget(row);
                                    setRejectOpen(true);
                                  }}
                                >
                                  <XCircle className="h-3.5 w-3.5" aria-hidden />
                                  Tolak
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
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
                  onPageChange={(p) => void fetchList(p, perPage)}
                  onPerPageChange={handlePerPageChange}
                />
              </div>
            )}
          </SectionCard>
        </div>

        {canExport && (
          <ExportWithdrawsDialog
            open={exportOpen}
            onOpenChange={setExportOpen}
          />
        )}

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <XCircle className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <DialogTitle>Tolak withdraw?</DialogTitle>
                  <DialogDescription>
                    Pengajuan ini akan ditolak. Pastikan kebijakan internal
                    sudah sesuai sebelum melanjutkan.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {rejectTarget && (
              <ul className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                <li>
                  <span className="text-slate-500">ID: </span>
                  {String(rejectTarget.id)}
                </li>
                <li>
                  <span className="text-slate-500">Nominal: </span>
                  {formatIdr(rejectTarget.amount)}
                </li>
                <li>
                  <span className="text-slate-500">Pengguna: </span>
                  {rejectTarget.user?.name ?? "—"}
                </li>
              </ul>
            )}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectTarget(null);
                }}
                disabled={!!actionId}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-10 gap-2 rounded-lg"
                disabled={!!actionId}
                onClick={() => void confirmReject()}
              >
                {actionId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Ya, tolak"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

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
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { useAuth } from "@/context/AuthContext";
import { deleteExport, downloadExport, getExports } from "@/lib/apiClient";
import { formatDateTimeId } from "@/lib/date";
import type { ExportRequestItem, ExportStatus } from "@/types/exportRequest";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 4000;

const STATUS_META: Record<ExportStatus, { label: string; className: string }> = {
  pending: { label: "Antre", className: "bg-amber-50 text-amber-700" },
  processing: { label: "Diproses", className: "bg-blue-50 text-blue-700" },
  completed: { label: "Selesai", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Gagal", className: "bg-rose-50 text-rose-700" },
  expired: { label: "Kedaluwarsa", className: "bg-slate-100 text-slate-600" },
};

const headCls = "h-11 text-xs font-semibold text-slate-500";

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPeriod(filters: ExportRequestItem["filters"]): string {
  const from = filters?.start_date;
  const to = filters?.end_date;
  if (!from && !to) return "Semua data";
  return `${from ?? "…"} s/d ${to ?? "…"}`;
}

function formatDateTime(value: string | null): string {
  const dt = formatDateTimeId(value ?? undefined);
  return dt ? `${dt.date}, ${dt.time.slice(0, 5)}` : "-";
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { message?: string })?.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export default function DownloadReportPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<ExportRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ExportStatus>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExportRequestItem | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const canView = hasPermission("orders.index");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchList = useCallback(
    async (targetPage = page, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await getExports({
          page: targetPage,
          per_page: perPage,
          status: statusFilter === "all" ? undefined : statusFilter,
        });
        setRows(res.data.data);
        setPage(res.data.current_page);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
      } catch (err) {
        setError(errorMessage(err, "Gagal memuat daftar download."));
        if (!silent) setRows([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perPage, statusFilter]
  );

  useEffect(() => {
    if (!authLoading && !canView) router.replace("/dashboard");
  }, [authLoading, canView, router]);

  useEffect(() => {
    if (!authLoading && canView) void fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canView, perPage, statusFilter]);

  // Selama ada export antre/diproses, refresh daftar otomatis.
  const hasActive = rows.some(
    (r) => r.status === "pending" || r.status === "processing"
  );
  useEffect(() => {
    if (!hasActive) return;
    pollRef.current = setTimeout(() => void fetchList(page, true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive, rows]);

  const handleDownload = async (item: ExportRequestItem) => {
    setDownloadingId(item.id);
    try {
      const { blob, filename } = await downloadExport(item.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorMessage(err, "Gagal mengunduh file."));
      void fetchList(page, true);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExport(deleteTarget.id);
      toast.success("Export dihapus.");
      setDeleteTarget(null);
      await fetchList(page);
    } catch (err) {
      toast.error(errorMessage(err, "Gagal menghapus export."));
    } finally {
      setDeleting(false);
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

  if (!canView) return null;

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
              { label: "Download Report" },
            ]}
            icon={Download}
            title="Download Report"
            description="File export report yang Anda minta. File dibuat di latar belakang dan tersedia 7 hari sejak selesai."
            action={
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-lg border-slate-200 bg-white"
                disabled={loading}
                onClick={() => void fetchList(page)}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </Button>
            }
          />

          <SectionCard
            icon={FileSpreadsheet}
            title="Daftar Download"
            description={`${total} file`}
          >
            <div className="mb-4">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as "all" | ExportStatus)}
              >
                <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white sm:w-[220px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {(Object.keys(STATUS_META) as ExportStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <p className="py-10 text-center text-sm text-slate-500">
                Belum ada file. Buat export dari halaman report, mis. tombol
                Export di Laporan Pengiriman.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className={headCls}>Jenis</TableHead>
                        <TableHead className={headCls}>Periode</TableHead>
                        <TableHead className={headCls}>Status</TableHead>
                        <TableHead className={`${headCls} text-right`}>
                          Baris
                        </TableHead>
                        <TableHead className={headCls}>Ukuran</TableHead>
                        <TableHead className={headCls}>Dibuat</TableHead>
                        <TableHead className={headCls}>Berlaku Sampai</TableHead>
                        <TableHead className={`${headCls} text-right`}>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((item) => {
                        const meta = STATUS_META[item.status];
                        return (
                          <TableRow
                            key={item.id}
                            className="border-slate-100 hover:bg-slate-50/60"
                          >
                            <TableCell className="whitespace-nowrap py-4 text-sm font-medium text-slate-900">
                              {item.type_label}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                              {formatPeriod(item.filters)}
                            </TableCell>
                            <TableCell className="py-4">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
                                  meta.className
                                )}
                                title={item.error_message ?? undefined}
                              >
                                {(item.status === "pending" ||
                                  item.status === "processing") && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                                {meta.label}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 text-right text-sm tabular-nums text-slate-700">
                              {item.total_rows != null
                                ? item.total_rows.toLocaleString("id-ID")
                                : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                              {formatFileSize(item.file_size)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                              {formatDateTime(item.created_at)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                              {formatDateTime(item.expires_at)}
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-9 gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700"
                                  disabled={
                                    !item.is_downloadable ||
                                    downloadingId === item.id
                                  }
                                  onClick={() => void handleDownload(item)}
                                >
                                  {downloadingId === item.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Download
                                      className="h-3.5 w-3.5"
                                      aria-hidden
                                    />
                                  )}
                                  Unduh
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-9 w-9 rounded-lg border-rose-200 p-0 text-rose-600 hover:bg-rose-50"
                                  disabled={item.status === "processing"}
                                  onClick={() => setDeleteTarget(item)}
                                  aria-label="Hapus"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                  onPerPageChange={setPerPage}
                />
              </div>
            )}
          </SectionCard>
        </div>

        <Dialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader className="items-center text-center sm:text-center">
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-7 w-7" aria-hidden />
              </span>
              <DialogTitle>Hapus export ini?</DialogTitle>
              <DialogDescription>
                {deleteTarget?.type_label} ({formatPeriod(deleteTarget?.filters ?? null)})
                akan dihapus beserta filenya.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-10 gap-2 rounded-lg"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Ya, Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

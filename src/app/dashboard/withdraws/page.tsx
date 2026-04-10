"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/context/AuthContext";
import {
  approveWithdraw,
  getWithdraws,
  normalizeWithdrawRecords,
  rejectWithdraw,
} from "@/lib/apiClient";
import type { WithdrawRecord } from "@/types/wallet";
import { AxiosError } from "axios";
import {
  ArrowDownToLine,
  CheckCircle,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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

function statusBadge(status: string | undefined) {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "success" || s === "completed") {
    return (
      <Badge className="border-green-200 bg-green-100 text-green-800">
        <CheckCircle className="mr-1 h-3 w-3" />
        Disetujui
      </Badge>
    );
  }
  if (s === "rejected" || s === "failed" || s === "cancelled") {
    return (
      <Badge className="border-red-200 bg-red-100 text-red-800">
        <XCircle className="mr-1 h-3 w-3" />
        Ditolak
      </Badge>
    );
  }
  return (
    <Badge className="border-amber-200 bg-amber-100 text-amber-900">
      Menunggu
    </Badge>
  );
}

export default function WithdrawsAdminPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<WithdrawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | number | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<WithdrawRecord | null>(
    null
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWithdraws();
      setRows(normalizeWithdrawRecords(res));
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
  }, []);

  useEffect(() => {
    if (!authLoading && !hasPermission("withdraws.update")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!authLoading && hasPermission("withdraws.update")) {
      void fetchList();
    }
  }, [authLoading, hasPermission, fetchList]);

  const handleApprove = async (row: WithdrawRecord) => {
    setActionId(row.id);
    try {
      const res = await approveWithdraw(row.id);
      toast.success(res.message || "Withdraw disetujui.");
      await fetchList();
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
      await fetchList();
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                <ArrowDownToLine className="h-7 w-7 text-blue-600" />
                Permintaan withdraw
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Tinjau dan setujui atau tolak pengajuan penarikan saldo.
              </p>
            </div>
            <Button
              type="button"
              variant="blueGradientOutline"
              size="sm"
              className="gap-2"
              onClick={() => void fetchList()}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Muat ulang
            </Button>
          </div>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Daftar pengajuan</CardTitle>
            </CardHeader>
            <CardContent>
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
                  Belum ada pengajuan withdraw.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[90px]">ID</TableHead>
                        <TableHead>Pengguna</TableHead>
                        <TableHead>Nominal</TableHead>
                        <TableHead>Rekening</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => {
                        const pending =
                          !row.status ||
                          String(row.status).toLowerCase() === "pending";
                        const busy = actionId === row.id;
                        return (
                          <TableRow key={String(row.id)}>
                            <TableCell className="font-mono text-sm">
                              {String(row.id)}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <p className="truncate font-medium">
                                  {row.user?.name ?? "—"}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">
                                  {row.user?.email ?? ""}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap tabular-nums">
                              {formatIdr(row.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[220px] text-sm">
                                <p className="truncate">
                                  {row.bank_account?.bank_name ?? "—"}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">
                                  {row.bank_account?.account_number ?? ""}{" "}
                                  {row.bank_account?.account_name
                                    ? `· ${row.bank_account.account_name}`
                                    : ""}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{statusBadge(row.status)}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {row.created_at
                                ? new Date(row.created_at).toLocaleString(
                                    "id-ID"
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {pending ? (
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={busy}
                                    onClick={() => void handleApprove(row)}
                                  >
                                    {busy ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Setujui"
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="blueGradientOutline"
                                    disabled={busy}
                                    onClick={() => {
                                      setRejectTarget(row);
                                      setRejectOpen(true);
                                    }}
                                  >
                                    Tolak
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-md">
            <DialogHeader className="shrink-0 text-left">
              <DialogTitle>Tolak withdraw?</DialogTitle>
              <DialogDescription>
                Pengajuan ini akan ditolak. Pastikan kebijakan internal sudah
                sesuai sebelum melanjutkan.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2 text-sm">
              {rejectTarget && (
                <ul className="space-y-1 rounded-md border bg-slate-50 p-3">
                  <li>
                    <span className="text-muted-foreground">ID: </span>
                    {String(rejectTarget.id)}
                  </li>
                  <li>
                    <span className="text-muted-foreground">Nominal: </span>
                    {formatIdr(rejectTarget.amount)}
                  </li>
                  <li>
                    <span className="text-muted-foreground">Pengguna: </span>
                    {rejectTarget.user?.name ?? "—"}
                  </li>
                </ul>
              )}
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t pt-4">
              <Button
                type="button"
                variant="blueGradientOutline"
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

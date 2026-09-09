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
import { formatDateIdLong } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import {
  deleteKerjaSamaInvoice,
  downloadKerjaSamaInvoice,
  getKerjaSamaInvoice,
  issueKerjaSamaInvoice,
} from "@/lib/apiClient";
import {
  KERJA_SAMA_INVOICE_STATUS_LABEL,
  type KerjaSamaInvoice,
} from "@/types/kerjaSama";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Download,
  Loader2,
  ReceiptText,
  Send,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { message?: string })?.message || fallback;
  }
  return fallback;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "border-green-200 bg-green-100 text-green-800";
    case "partially_paid":
      return "border-amber-200 bg-amber-100 text-amber-900";
    case "overdue":
      return "border-red-200 bg-red-100 text-red-800";
    case "issued":
      return "border-blue-200 bg-blue-100 text-blue-800";
    case "void":
      return "border-gray-200 bg-gray-100 text-gray-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export default function KerjaSamaInvoiceDetailPage() {
  const params = useParams();
  const invoiceId = Number(params.id);
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();

  const [invoice, setInvoice] = useState<KerjaSamaInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = hasPermission("kerja-sama.invoices.manage");
  const canDelete = hasPermission("kerja-sama.invoices.delete");

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getKerjaSamaInvoice(invoiceId);
      setInvoice(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat detail invoice."));
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (!authLoading && !hasPermission("kerja-sama.invoices.view")) {
      router.replace("/dashboard/kerja-sama/invoices");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!authLoading && hasPermission("kerja-sama.invoices.view")) {
      void fetchInvoice();
    }
  }, [authLoading, hasPermission, fetchInvoice]);

  const handleIssue = async () => {
    setIssuing(true);
    try {
      await issueKerjaSamaInvoice(invoiceId);
      toast.success("Invoice ditandai sudah terkirim.");
      await fetchInvoice();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menandai invoice terkirim."));
    } finally {
      setIssuing(false);
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      const blob = await downloadKerjaSamaInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoice_no}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengunduh invoice."));
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteKerjaSamaInvoice(invoiceId);
      toast.success("Invoice berhasil dihapus.");
      router.push("/dashboard/kerja-sama/invoices");
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menghapus invoice."));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (authLoading || loading) {
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

  if (!hasPermission("kerja-sama.invoices.view")) return null;

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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => router.push("/dashboard/kerja-sama/invoices")}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                  <ReceiptText className="h-6 w-6 text-blue-600" />
                  {invoice?.invoice_no || "Invoice"}
                </h1>
                {invoice && (
                  <Badge className={statusBadgeClass(invoice.status)}>
                    {KERJA_SAMA_INVOICE_STATUS_LABEL[invoice.status] ??
                      invoice.status}
                  </Badge>
                )}
              </div>
            </div>

            {invoice && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Unduh PDF
                </Button>
                {canManage && invoice.status === "draft" && (
                  <Button
                    type="button"
                    className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => void handleIssue()}
                    disabled={issuing}
                  >
                    {issuing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Tandai Terkirim
                  </Button>
                )}
                {canDelete && invoice.status === "draft" && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="gap-2"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </Button>
                )}
              </div>
            )}
          </div>

          {error ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : invoice ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Akun
                    </p>
                    <p className="font-medium">
                      {invoice.user?.company_name ||
                        invoice.user?.name ||
                        "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.user?.email}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Periode</p>
                    <p className="font-medium">
                      {invoice.period_start && invoice.period_end
                        ? `${formatDateIdLong(
                            invoice.period_start
                          )} – ${formatDateIdLong(invoice.period_end)}`
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Jatuh Tempo
                    </p>
                    <p className="font-medium">
                      {formatDateIdLong(invoice.due_date)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Total Tagihan
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      {formatRupiah(invoice.grand_total)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rincian Biaya</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatRupiah(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Surcharge</span>
                    <span>{formatRupiah(invoice.surcharge_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diskon</span>
                    <span>-{formatRupiah(invoice.discount_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pajak</span>
                    <span>{formatRupiah(invoice.tax_total)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Grand Total</span>
                    <span>{formatRupiah(invoice.grand_total)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Sudah Dibayar</span>
                    <span>{formatRupiah(invoice.paid_amount)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Rincian Order ({invoice.line_items?.length ?? 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!invoice.line_items || invoice.line_items.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                      Tidak ada rincian order.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No. Resi / AWB</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Tgl Kirim</TableHead>
                            <TableHead>Pengirim</TableHead>
                            <TableHead>Penerima</TableHead>
                            <TableHead className="text-right">
                              Ongkir
                            </TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoice.line_items.map((item) => (
                            <TableRow key={item.order_id}>
                              <TableCell>
                                <p className="font-mono text-sm">
                                  {item.awb_no || item.reference_no}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.reference_no}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.vendor}</Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                {formatDateIdLong(item.shipment_date)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.sender_name || "—"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.receiver_name || "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-right tabular-nums">
                                {formatRupiah(item.ongkir)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                                {formatRupiah(item.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Hapus invoice ini?</DialogTitle>
              <DialogDescription>
                Transaksi yang ter-link ke invoice ini akan dikembalikan ke
                status confirmed dan bisa di-generate ulang. Tindakan ini
                hanya berlaku untuk invoice berstatus draft.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Ya, Hapus"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

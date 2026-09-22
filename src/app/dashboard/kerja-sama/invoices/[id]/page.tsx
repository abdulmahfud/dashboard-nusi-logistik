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
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { useAuth } from "@/context/AuthContext";
import { formatDateIdLong } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import {
  deleteKerjaSamaInvoice,
  downloadKerjaSamaInvoice,
  getKerjaSamaInvoice,
  issueKerjaSamaInvoice,
} from "@/lib/apiClient";
import type { KerjaSamaInvoice } from "@/types/kerjaSama";
import { AxiosError } from "axios";
import {
  AlertTriangle,
  Boxes,
  Calendar,
  DollarSign,
  Download,
  Loader2,
  Send,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { InvoiceStatusBadge } from "../status-badge";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { message?: string })?.message || fallback;
  }
  return fallback;
}

const headCls = "h-11 text-xs font-semibold text-slate-500";
const rowCls = "flex justify-between gap-4 py-2 text-sm";

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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              {
                label: "Invoice Kerja Sama",
                href: "/dashboard/kerja-sama/invoices",
              },
              { label: invoice?.invoice_no || "Detail" },
            ]}
            back={{ href: "/dashboard/kerja-sama/invoices" }}
            title={invoice?.invoice_no || "Invoice"}
            action={
              invoice ? (
                <div className="flex flex-wrap items-center gap-2">
                  <InvoiceStatusBadge status={invoice.status} />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-2 rounded-lg border-slate-200"
                    onClick={() => void handleDownload()}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden />
                    )}
                    Unduh PDF
                  </Button>
                  {canManage && invoice.status === "draft" && (
                    <Button
                      type="button"
                      className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                      onClick={() => void handleIssue()}
                      disabled={issuing}
                    >
                      {issuing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" aria-hidden />
                      )}
                      Tandai Terkirim
                    </Button>
                  )}
                  {canDelete && invoice.status === "draft" && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-10 gap-2 rounded-lg"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Hapus
                    </Button>
                  )}
                </div>
              ) : undefined
            }
          />

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
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <UserIcon className="h-3.5 w-3.5" aria-hidden />
                    Akun
                  </div>
                  <p className="mt-1 font-medium text-slate-900">
                    {invoice.user?.company_name || invoice.user?.name || "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {invoice.user?.email}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    Periode
                  </div>
                  <p className="mt-1 font-medium text-slate-900">
                    {invoice.period_start && invoice.period_end
                      ? `${formatDateIdLong(
                          invoice.period_start
                        )} – ${formatDateIdLong(invoice.period_end)}`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    Jatuh Tempo
                  </div>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatDateIdLong(invoice.due_date)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <DollarSign className="h-3.5 w-3.5" aria-hidden />
                    Total Tagihan
                  </div>
                  <p className="mt-1 text-lg font-bold text-blue-700">
                    {formatRupiah(invoice.grand_total)}
                  </p>
                </div>
              </div>

              <SectionCard icon={DollarSign} title="Rincian Biaya">
                <div className="divide-y divide-slate-100">
                  <div className={rowCls}>
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900">
                      {formatRupiah(invoice.subtotal)}
                    </span>
                  </div>
                  <div className={rowCls}>
                    <span className="text-slate-500">Surcharge</span>
                    <span className="text-slate-900">
                      {formatRupiah(invoice.surcharge_total)}
                    </span>
                  </div>
                  <div className={rowCls}>
                    <span className="text-slate-500">Diskon</span>
                    <span className="text-slate-900">
                      -{formatRupiah(invoice.discount_total)}
                    </span>
                  </div>
                  <div className={rowCls}>
                    <span className="text-slate-500">Pajak</span>
                    <span className="text-slate-900">
                      {formatRupiah(invoice.tax_total)}
                    </span>
                  </div>
                  <div className={`${rowCls} font-semibold`}>
                    <span className="text-slate-900">Grand Total</span>
                    <span className="text-slate-900">
                      {formatRupiah(invoice.grand_total)}
                    </span>
                  </div>
                  <div className={rowCls}>
                    <span className="text-emerald-700">Sudah Dibayar</span>
                    <span className="font-semibold text-emerald-700">
                      {formatRupiah(invoice.paid_amount)}
                    </span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={Boxes}
                title="Rincian Order"
                description={`${invoice.line_items?.length ?? 0} order`}
              >
                {!invoice.line_items || invoice.line_items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Tidak ada rincian order.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100 hover:bg-transparent">
                          <TableHead className={headCls}>
                            No. Resi / AWB
                          </TableHead>
                          <TableHead className={headCls}>Vendor</TableHead>
                          <TableHead className={headCls}>
                            Tgl Kirim
                          </TableHead>
                          <TableHead className={headCls}>Pengirim</TableHead>
                          <TableHead className={headCls}>Penerima</TableHead>
                          <TableHead className={`${headCls} text-right`}>
                            Ongkir
                          </TableHead>
                          <TableHead className={`${headCls} text-right`}>
                            Total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.line_items.map((item) => (
                          <TableRow
                            key={item.order_id}
                            className="border-slate-100 hover:bg-slate-50/60"
                          >
                            <TableCell className="py-4">
                              <p className="font-mono text-xs text-slate-700">
                                {item.awb_no || item.reference_no}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.reference_no}
                              </p>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase text-blue-700">
                                {item.vendor}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                              {formatDateIdLong(item.shipment_date)}
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-700">
                              {item.sender_name || "—"}
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-700">
                              {item.receiver_name || "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-right text-sm tabular-nums text-slate-700">
                              {formatRupiah(item.ongkir)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-4 text-right text-sm font-medium tabular-nums text-slate-900">
                              {formatRupiah(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </SectionCard>
            </>
          ) : null}
        </div>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader className="items-center text-center sm:text-center">
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-7 w-7" aria-hidden />
              </span>
              <DialogTitle>Hapus invoice ini?</DialogTitle>
              <DialogDescription>
                Transaksi yang ter-link ke invoice ini akan dikembalikan ke
                status confirmed dan bisa di-generate ulang. Tindakan ini
                hanya berlaku untuk invoice berstatus draft.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
                onClick={() => setDeleteOpen(false)}
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

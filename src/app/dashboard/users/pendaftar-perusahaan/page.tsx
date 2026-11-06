"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/context/AuthContext";
import apiClient, {
  approveCorporateRegistration,
  corporateDocumentUrl,
  getUsers,
  rejectCorporateRegistration,
} from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import type { User } from "@/types/users";

const headCls = "h-11 text-xs font-semibold text-slate-500";

const JENIS_USAHA_LABEL: Record<string, string> = {
  ecommerce: "E-commerce",
  retail: "Retail",
  distributor: "Distributor",
  manufaktur: "Manufaktur",
  logistik: "Logistik",
  umkm: "UMKM",
  lainnya: "Lainnya",
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Buka dokumen (NPWP/NIB/KTP) lewat blob + Bearer auth, pola sama ClaimAttachmentLink. */
function DocumentButton({
  userId,
  type,
  label,
}: {
  userId: number;
  type: "npwp" | "nib" | "pic_ktp";
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Blob>(corporateDocumentUrl(userId, type), {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error(`Gagal membuka dokumen ${label}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => void handleOpen()}
      className="h-8 gap-1.5 rounded-lg border-blue-200 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </Button>
  );
}

export default function PendaftarPerusahaanPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canManage = hasPermission("users.update");

  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(
    async (targetPage = page, targetPerPage = perPage) => {
      if (!canManage) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getUsers({
          pending_corporate: true,
          page: targetPage,
          per_page: targetPerPage,
        });
        setItems(res.data.data);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
      } catch (e) {
        const msg =
          e instanceof AxiosError
            ? getAxiosErrorMessage(e, "Gagal memuat daftar pendaftar.")
            : "Gagal memuat daftar pendaftar.";
        setError(msg);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [canManage, page, perPage]
  );

  useEffect(() => {
    if (!authLoading && !canManage) {
      router.replace("/dashboard");
    }
  }, [authLoading, canManage, router]);

  useEffect(() => {
    if (!authLoading && canManage) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canManage, page, perPage]);

  // ---- Approve ----
  const [approveTarget, setApproveTarget] = useState<User | null>(null);
  const [approving, setApproving] = useState(false);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      await approveCorporateRegistration(approveTarget.id);
      toast.success("Pendaftaran perusahaan disetujui.");
      setApproveTarget(null);
      void load();
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal menyetujui pendaftaran.")
          : "Gagal menyetujui pendaftaran."
      );
    } finally {
      setApproving(false);
    }
  };

  // ---- Reject ----
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }
    setRejecting(true);
    try {
      await rejectCorporateRegistration(rejectTarget.id, rejectReason.trim());
      toast.success("Pendaftaran perusahaan ditolak.");
      setRejectTarget(null);
      setRejectReason("");
      void load();
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal menolak pendaftaran.")
          : "Gagal menolak pendaftaran."
      );
    } finally {
      setRejecting(false);
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

  if (!canManage) return null;

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

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-12 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Pendaftar Perusahaan" },
            ]}
            icon={Building2}
            title="Pendaftar Perusahaan"
            description="Tinjau dokumen dan setujui atau tolak pendaftaran akun perusahaan baru."
          />

          <SectionCard
            icon={Building2}
            title="Menunggu Persetujuan"
            description={
              total > 0
                ? `${total} pendaftar menunggu`
                : loading
                  ? "Memuat…"
                  : "Tidak ada pendaftar yang menunggu persetujuan"
            }
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => void load()}
                disabled={loading}
              >
                <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
                Muat Ulang
              </Button>
            }
          >
            {error && !loading ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Building2 className="h-12 w-12 text-slate-300" />
                <p className="max-w-sm text-sm text-slate-500">
                  Belum ada pendaftaran perusahaan yang menunggu persetujuan.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className={headCls}>Perusahaan</TableHead>
                        <TableHead className={headCls}>Kontak</TableHead>
                        <TableHead className={headCls}>Jenis Usaha</TableHead>
                        <TableHead className={headCls}>Dokumen</TableHead>
                        <TableHead className={headCls}>Terdaftar</TableHead>
                        <TableHead className={`${headCls} text-right`}>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((u) => (
                        <TableRow key={u.id} className="border-slate-100 hover:bg-slate-50/60">
                          <TableCell className="py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {u.company_name ?? "—"}
                            </p>
                            <p className="text-xs text-slate-500">PIC: {u.pic_name ?? u.name}</p>
                          </TableCell>
                          <TableCell className="py-4 text-sm">
                            <p className="text-slate-900">{u.email}</p>
                            <p className="text-xs text-slate-500">{u.whatsapp}</p>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700">
                            {JENIS_USAHA_LABEL[u.jenis_usaha ?? ""] ?? u.jenis_usaha ?? "—"}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-wrap gap-1.5">
                              <DocumentButton userId={u.id} type="npwp" label="NPWP" />
                              <DocumentButton userId={u.id} type="nib" label="NIB" />
                              <DocumentButton userId={u.id} type="pic_ktp" label="KTP" />
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm text-slate-600">
                            {formatDate(u.created_at)}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="h-9 gap-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() => setApproveTarget(u)}
                              >
                                <CheckCircle2 className="h-4 w-4" aria-hidden />
                                Setujui
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 gap-1.5 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => setRejectTarget(u)}
                              >
                                <XCircle className="h-4 w-4" aria-hidden />
                                Tolak
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <ul className="flex flex-col gap-3 md:hidden">
                  {items.map((u) => (
                    <li key={u.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{u.company_name ?? "—"}</p>
                      <p className="text-xs text-slate-500">PIC: {u.pic_name ?? u.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{u.email} · {u.whatsapp}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {JENIS_USAHA_LABEL[u.jenis_usaha ?? ""] ?? u.jenis_usaha ?? "—"} · {formatDate(u.created_at)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <DocumentButton userId={u.id} type="npwp" label="NPWP" />
                        <DocumentButton userId={u.id} type="nib" label="NIB" />
                        <DocumentButton userId={u.id} type="pic_ktp" label="KTP" />
                      </div>
                      <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 flex-1 gap-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => setApproveTarget(u)}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Setujui
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 flex-1 gap-1.5 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => setRejectTarget(u)}
                        >
                          <XCircle className="h-4 w-4" aria-hidden />
                          Tolak
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>

                <NumberedPagination
                  className="mt-4"
                  page={page}
                  lastPage={lastPage}
                  total={total}
                  perPage={perPage}
                  disabled={loading}
                  onPageChange={setPage}
                  onPerPageChange={(n) => {
                    setPerPage(n);
                    setPage(1);
                  }}
                />
              </>
            )}
          </SectionCard>
        </div>

        <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Setujui pendaftaran perusahaan?</DialogTitle>
              <DialogDescription>
                {approveTarget?.company_name} akan langsung bisa mengakses dashboard
                setelah disetujui.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setApproveTarget(null)}>
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void handleApprove()}
                disabled={approving}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {approving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan
                  </>
                ) : (
                  "Setujui"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!rejectTarget}
          onOpenChange={(open) => {
            if (!open) {
              setRejectTarget(null);
              setRejectReason("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tolak pendaftaran perusahaan?</DialogTitle>
              <DialogDescription>
                Jelaskan alasan penolakan untuk {rejectTarget?.company_name}.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Jelaskan alasan penolakan…"
              rows={3}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void handleReject()}
                disabled={rejecting}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan
                  </>
                ) : (
                  "Tolak"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

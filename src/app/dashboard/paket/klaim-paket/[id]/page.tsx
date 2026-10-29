"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageCircle, Settings2, User } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClaimAttachmentImage } from "@/components/claims/claim-attachment-image";
import { ClaimAttachmentLink } from "@/components/claims/claim-attachment-link";
import { ClaimManageDialog } from "@/components/claims/claim-manage-dialog";
import { ClaimReplyThread } from "@/components/claims/claim-reply-thread";
import { ClaimStatusBadge } from "@/components/claims/claim-status-badge";
import { useAuth } from "@/context/AuthContext";
import { getPackageClaim } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { getVendorLabel } from "@/lib/vendorList";
import { claimIssueTypeLabel, formatClaimDateTime } from "@/lib/packageClaimUi";
import type { PackageClaim } from "@/types/packageClaim";

function unwrapClaimDetail(raw: unknown): PackageClaim | null {
  if (!raw || typeof raw !== "object") return null;
  const data = (raw as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  return data as PackageClaim;
}

export default function KlaimPaketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const claimId =
    typeof idParam === "string"
      ? Number(idParam)
      : Array.isArray(idParam)
        ? Number(idParam[0])
        : NaN;

  const { loading: authLoading, hasPermission } = useAuth();
  const canView = hasPermission("claims.view");
  const canManage = hasPermission("claims.manage");
  const canAccess = canView || canManage;

  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<PackageClaim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(claimId) || claimId < 1) {
      setError("Klaim tidak valid.");
      setLoading(false);
      return;
    }
    if (!canAccess) return;

    setLoading(true);
    setError(null);
    try {
      const raw = await getPackageClaim(claimId);
      const c = unwrapClaimDetail(raw);
      if (!c) {
        setError("Data klaim tidak ditemukan.");
        setClaim(null);
        return;
      }
      setClaim(c);
    } catch (e) {
      const msg =
        e instanceof AxiosError
          ? getAxiosErrorMessage(e, "Gagal memuat klaim.")
          : "Gagal memuat klaim.";
      setError(msg);
      setClaim(null);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [claimId, canAccess]);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard/paket/klaim-paket");
  }, [router]);

  useEffect(() => {
    if (!authLoading && !canAccess) {
      router.replace("/dashboard");
    }
  }, [authLoading, canAccess, router]);

  useEffect(() => {
    if (!authLoading && canAccess) {
      void load();
    }
  }, [authLoading, canAccess, load]);

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

  if (!canAccess) {
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

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-12 md:p-6">
          <Button
            type="button"
            variant="blueGradientOutline"
            size="sm"
            className="w-fit gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : error || !claim ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-red-600" role="alert">
                  {error ?? "Klaim tidak ditemukan."}
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  variant="blueGradientOutline"
                  onClick={handleBack}
                >
                  Kembali
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
                      {claim.title}
                    </h1>
                    <ClaimStatusBadge
                      status={String(claim.status)}
                      statusLabel={claim.status_label}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    #{claim.id} · {getVendorLabel(claim.vendor)} · {claim.reference_no} ·
                    Diajukan {formatClaimDateTime(claim.created_at)}
                  </p>
                  {claim.user && (
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                      <User className="h-3.5 w-3.5" aria-hidden />
                      {claim.user.name ?? "Pengguna"}
                      {claim.user.email ? ` · ${claim.user.email}` : ""}
                    </p>
                  )}
                  {claim.handler && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Ditangani oleh {claim.handler.name}
                    </p>
                  )}
                </div>

                {canManage && (
                  <Button
                    type="button"
                    variant="blueGradientOutline"
                    className="shrink-0 gap-2"
                    onClick={() => setManageOpen(true)}
                  >
                    <Settings2 className="h-4 w-4" />
                    Kelola klaim
                  </Button>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detail Klaim</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">Jenis Kendala</p>
                    <p className="text-slate-600">
                      {claimIssueTypeLabel(claim.issue_type, claim.issue_type_label)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Deskripsi</p>
                    <p className="whitespace-pre-wrap text-slate-600">{claim.description}</p>
                  </div>
                  {claim.attachments.length > 0 && (
                    <div>
                      <p className="mb-2 font-medium text-slate-700">Lampiran</p>
                      <div className="flex flex-wrap gap-2">
                        {claim.attachments.map((a) =>
                          (a.mime ?? "").startsWith("image/") ? (
                            <ClaimAttachmentImage key={a.id} attachment={a} />
                          ) : (
                            <div key={a.id} className="w-full">
                              <ClaimAttachmentLink attachment={a} />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {claim.status === "ditolak" && claim.rejection_reason && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                      <p className="font-medium text-rose-800">Alasan Penolakan</p>
                      <p className="text-rose-700">{claim.rejection_reason}</p>
                    </div>
                  )}
                  {claim.resolved_at && (
                    <p className="text-xs text-slate-400">
                      Selesai ditangani {formatClaimDateTime(claim.resolved_at)}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5 text-blue-600" aria-hidden />
                    Percakapan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClaimReplyThread
                    claim={claim}
                    isStaff={canManage}
                    onUpdated={setClaim}
                  />
                </CardContent>
              </Card>

              {canManage && (
                <ClaimManageDialog
                  claim={claim}
                  open={manageOpen}
                  onOpenChange={setManageOpen}
                  onUpdated={setClaim}
                />
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

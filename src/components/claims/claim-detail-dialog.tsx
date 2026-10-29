"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClaimAttachmentLink } from "@/components/claims/claim-attachment-link";
import { ClaimStatusBadge } from "@/components/claims/claim-status-badge";
import { updatePackageClaim } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { getVendorLabel } from "@/lib/vendorList";
import {
  CLAIM_STATUS_OPTIONS,
  claimIssueTypeLabel,
  formatClaimDateTime,
} from "@/lib/packageClaimUi";
import type { PackageClaim } from "@/types/packageClaim";

type Props = {
  claim: PackageClaim | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tampilkan panel ubah status + simpan. Dipakai di Klaim Masuk (admin) dan
   * Klaim Paket (kalau viewer kebetulan punya claims.manage). */
  canManage: boolean;
  onUpdated?: (updated: PackageClaim) => void;
};

function unwrapClaimDetail(raw: unknown): PackageClaim | null {
  if (!raw || typeof raw !== "object") return null;
  const data = (raw as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  return data as PackageClaim;
}

/** Dialog detail + kelola status klaim - dipakai bersama oleh halaman Klaim Paket dan Klaim Masuk. */
export function ClaimDetailDialog({
  claim,
  open,
  onOpenChange,
  canManage,
  onUpdated,
}: Props) {
  const [adminStatus, setAdminStatus] = useState("");
  const [adminRejectionReason, setAdminRejectionReason] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  useEffect(() => {
    if (open && claim) {
      setAdminStatus(String(claim.status));
      setAdminRejectionReason(claim.rejection_reason ?? "");
    }
  }, [open, claim]);

  const handleAdminSave = async () => {
    if (!claim || !canManage) return;
    if (adminStatus === "ditolak" && !adminRejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }
    setSavingAdmin(true);
    try {
      const raw = await updatePackageClaim(claim.id, {
        status: adminStatus,
        rejection_reason:
          adminStatus === "ditolak" ? adminRejectionReason.trim() : null,
      });
      const updated = unwrapClaimDetail(raw);
      toast.success("Klaim diperbarui.");
      if (updated) onUpdated?.(updated);
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal memperbarui klaim.")
          : "Gagal memperbarui klaim."
      );
    } finally {
      setSavingAdmin(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {claim && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {claim.title}
                <ClaimStatusBadge
                  status={String(claim.status)}
                  statusLabel={claim.status_label}
                />
              </DialogTitle>
              <DialogDescription>
                #{claim.id} · {getVendorLabel(claim.vendor)} · {claim.reference_no}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-700">Jenis Kendala</p>
                <p className="text-slate-600">
                  {claimIssueTypeLabel(claim.issue_type, claim.issue_type_label)}
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Deskripsi</p>
                <p className="whitespace-pre-wrap text-slate-600">
                  {claim.description}
                </p>
              </div>
              {claim.user && (
                <div>
                  <p className="font-medium text-slate-700">Pengaju</p>
                  <p className="text-slate-600">
                    {claim.user.name}
                    {claim.user.email ? ` · ${claim.user.email}` : ""}
                  </p>
                </div>
              )}
              {claim.attachments.length > 0 && (
                <div>
                  <p className="mb-2 font-medium text-slate-700">Lampiran</p>
                  <div className="flex flex-col gap-2">
                    {claim.attachments.map((a) => (
                      <ClaimAttachmentLink key={a.id} attachment={a} />
                    ))}
                  </div>
                </div>
              )}
              {claim.status === "ditolak" && claim.rejection_reason && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="font-medium text-rose-800">Alasan Penolakan</p>
                  <p className="text-rose-700">{claim.rejection_reason}</p>
                </div>
              )}
              {claim.handler && (
                <p className="text-xs text-slate-400">
                  Ditangani oleh {claim.handler.name}
                </p>
              )}
              <p className="text-xs text-slate-400">
                Diajukan {formatClaimDateTime(claim.created_at)}
                {claim.resolved_at
                  ? ` · Selesai ditangani ${formatClaimDateTime(claim.resolved_at)}`
                  : ""}
              </p>

              {canManage && (
                <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Kelola Klaim
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="kp-adm-status">Status</Label>
                    <Select value={adminStatus} onValueChange={setAdminStatus}>
                      <SelectTrigger id="kp-adm-status" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLAIM_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {adminStatus === "ditolak" && (
                    <div className="space-y-2">
                      <Label htmlFor="kp-adm-reason">Alasan Penolakan</Label>
                      <Textarea
                        id="kp-adm-reason"
                        value={adminRejectionReason}
                        onChange={(e) => setAdminRejectionReason(e.target.value)}
                        placeholder="Jelaskan alasan penolakan…"
                        rows={3}
                        className="bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {canManage && (
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleAdminSave()}
                  disabled={savingAdmin}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {savingAdmin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ImagePlus, Loader2, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ClaimReplyAttachmentImage } from "@/components/claims/claim-reply-attachment-image";
import { ClaimStatusBadge } from "@/components/claims/claim-status-badge";
import { createPackageClaimReply, updatePackageClaim } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { getVendorLabel } from "@/lib/vendorList";
import {
  CLAIM_REPLY_ACCEPT_IMAGES,
  CLAIM_REPLY_MAX_FILES,
  CLAIM_REPLY_MAX_IMAGE_BYTES,
  formatBytes,
  validateClaimReplyImages,
} from "@/lib/claim-upload";
import {
  CLAIM_STATUS_OPTIONS,
  claimIssueTypeLabel,
  formatClaimDateTime,
} from "@/lib/packageClaimUi";
import { cn } from "@/lib/utils";
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

  const [replyMessage, setReplyMessage] = useState("");
  const [replyImages, setReplyImages] = useState<File[]>([]);
  const [replyImageHint, setReplyImageHint] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  const replyPreviews = useMemo(
    () => replyImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [replyImages]
  );

  useEffect(() => {
    return () => {
      replyPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [replyPreviews]);

  useEffect(() => {
    if (open && claim) {
      setAdminStatus(String(claim.status));
      setAdminRejectionReason(claim.rejection_reason ?? "");
      setReplyMessage("");
      setReplyImages([]);
      setReplyImageHint(null);
    }
  }, [open, claim]);

  const handleReplyImagesChange = (list: File[]) => {
    setReplyImageHint(null);
    if (list.length === 0) {
      setReplyImages([]);
      return;
    }
    const v = validateClaimReplyImages(list);
    v.info.forEach((m) => toast.info(m));
    if (!v.ok) {
      v.errors.forEach((m) => toast.error(m));
      setReplyImages([]);
      return;
    }
    setReplyImages(v.accepted);
    if (v.info.length) setReplyImageHint(v.info.join(" "));
  };

  const removeReplyImageAt = (index: number) => {
    setReplyImages((prev) => prev.filter((_, i) => i !== index));
    setReplyImageHint(null);
  };

  const handleSendReply = async () => {
    if (!claim || !canManage) return;
    const text = replyMessage.trim();
    if (!text && replyImages.length === 0) {
      toast.error("Tulis pesan atau lampirkan gambar.");
      return;
    }
    const recheck = validateClaimReplyImages(replyImages);
    if (!recheck.ok) {
      recheck.errors.forEach((m) => toast.error(m));
      return;
    }
    setSendingReply(true);
    try {
      const fd = new FormData();
      if (text) fd.append("message", text);
      recheck.accepted.forEach((f) => fd.append("images[]", f));
      const raw = await createPackageClaimReply(claim.id, fd);
      const updated = unwrapClaimDetail(raw);
      toast.success("Balasan terkirim.");
      setReplyMessage("");
      setReplyImages([]);
      setReplyImageHint(null);
      if (updated) onUpdated?.(updated);
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal mengirim balasan.")
          : "Gagal mengirim balasan."
      );
    } finally {
      setSendingReply(false);
    }
  };

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

              {(claim.replies.length > 0 || canManage) && (
                <div className="space-y-3">
                  <p className="font-medium text-slate-700">Balasan</p>

                  {claim.replies.length > 0 && (
                    <ul className="flex flex-col gap-3">
                      {claim.replies.map((r) => (
                        <li
                          key={r.id}
                          className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-700">
                              {r.author?.name ?? "Tim BhisaKirim"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatClaimDateTime(r.created_at)}
                            </span>
                          </div>
                          {r.message && (
                            <p className="mt-1 whitespace-pre-wrap text-slate-700">
                              {r.message}
                            </p>
                          )}
                          {r.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {r.attachments.map((a) => (
                                <ClaimReplyAttachmentImage key={a.id} attachment={a} />
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {canManage && (
                    <div className="space-y-2 rounded-lg border border-slate-100 bg-white p-3">
                      <Textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Tulis balasan untuk pengaju klaim…"
                        rows={3}
                        disabled={sendingReply}
                      />
                      <div
                        className={cn(
                          "rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/80 p-3 transition-colors",
                          "hover:border-blue-300 hover:bg-blue-50/40",
                          sendingReply && "pointer-events-none opacity-60"
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReplyImagesChange(Array.from(e.dataTransfer.files ?? []));
                        }}
                      >
                        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <ImagePlus className="h-4 w-4" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-700">
                              Seret gambar atau klik untuk memilih
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Maks. {formatBytes(CLAIM_REPLY_MAX_IMAGE_BYTES)} per gambar ·
                              maks. {CLAIM_REPLY_MAX_FILES} gambar
                            </p>
                          </div>
                          <Input
                            id="kp-reply-images"
                            type="file"
                            accept={CLAIM_REPLY_ACCEPT_IMAGES}
                            multiple
                            disabled={sendingReply}
                            className="sr-only"
                            onChange={(e) => {
                              const list = e.target.files ? Array.from(e.target.files) : [];
                              handleReplyImagesChange(list);
                              e.target.value = "";
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={sendingReply}
                            className="shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => document.getElementById("kp-reply-images")?.click()}
                          >
                            Pilih gambar
                          </Button>
                        </div>
                      </div>
                      {replyImageHint ? (
                        <p className="text-muted-foreground text-xs" role="status">
                          {replyImageHint}
                        </p>
                      ) : null}
                      {replyPreviews.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {replyPreviews.map((p, index) => (
                            <li
                              key={`${p.file.name}-${p.file.size}-${index}`}
                              className="relative h-16 w-16 overflow-hidden rounded-lg border shadow-sm"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element -- object URL lokal */}
                              <img src={p.url} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeReplyImageAt(index)}
                                aria-label={`Hapus ${p.file.name}`}
                                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleSendReply()}
                        disabled={sendingReply}
                        className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {sendingReply ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mengirim…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Kirim Balasan
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

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

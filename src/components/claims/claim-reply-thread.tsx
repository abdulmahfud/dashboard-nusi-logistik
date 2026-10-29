"use client";

import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { FileText as FileTextIcon, FileUp, Loader2, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClaimAttachmentImage } from "@/components/claims/claim-attachment-image";
import { ClaimAttachmentLink } from "@/components/claims/claim-attachment-link";
import { createPackageClaimReply } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import {
  CLAIM_ACCEPT_FILES,
  CLAIM_MAX_ATTACHMENT_BYTES,
  CLAIM_MAX_FILES,
  formatBytes,
  validateClaimFiles,
} from "@/lib/claim-upload";
import { formatClaimDateTime } from "@/lib/packageClaimUi";
import { cn } from "@/lib/utils";
import type { PackageClaim } from "@/types/packageClaim";

/** Status final (lihat PackageClaimStatus::final() di BE) - pemilik klaim tidak bisa membalas lagi setelahnya. */
const FINAL_STATUSES = new Set(["disetujui", "ditolak", "selesai"]);

type Props = {
  claim: PackageClaim;
  /** true kalau viewer ini staff (claims.manage) - staff selalu boleh membalas, walau status final. */
  isStaff: boolean;
  onUpdated: (updated: PackageClaim) => void;
};

function unwrapClaimDetail(raw: unknown): PackageClaim | null {
  if (!raw || typeof raw !== "object") return null;
  const data = (raw as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  return data as PackageClaim;
}

/** Thread balasan gaya chat (mirip WhatsApp) - dipakai di halaman detail Klaim Paket. */
export function ClaimReplyThread({ claim, isStaff, onUpdated }: Props) {
  const canReply = isStaff || !FINAL_STATUSES.has(String(claim.status));

  const [replyMessage, setReplyMessage] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replyFileHint, setReplyFileHint] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  const replyPreviews = useMemo(
    () => replyFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [replyFiles]
  );

  useEffect(() => {
    return () => {
      replyPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [replyPreviews]);

  const handleReplyFilesChange = (list: File[]) => {
    setReplyFileHint(null);
    if (list.length === 0) {
      setReplyFiles([]);
      return;
    }
    const v = validateClaimFiles(list);
    v.info.forEach((m) => toast.info(m));
    if (!v.ok) {
      v.errors.forEach((m) => toast.error(m));
      setReplyFiles([]);
      return;
    }
    setReplyFiles(v.accepted);
    if (v.info.length) setReplyFileHint(v.info.join(" "));
  };

  const removeReplyFileAt = (index: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
    setReplyFileHint(null);
  };

  const handleSendReply = async () => {
    if (!canReply) return;
    const text = replyMessage.trim();
    if (!text && replyFiles.length === 0) {
      toast.error("Tulis pesan atau lampirkan file.");
      return;
    }
    const recheck = validateClaimFiles(replyFiles);
    if (!recheck.ok) {
      recheck.errors.forEach((m) => toast.error(m));
      return;
    }
    setSendingReply(true);
    try {
      const fd = new FormData();
      if (text) fd.append("message", text);
      recheck.accepted.forEach((f) => fd.append("attachments[]", f));
      const raw = await createPackageClaimReply(claim.id, fd);
      const updated = unwrapClaimDetail(raw);
      toast.success("Balasan terkirim.");
      setReplyMessage("");
      setReplyFiles([]);
      setReplyFileHint(null);
      if (updated) onUpdated(updated);
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

  return (
    <div className="space-y-4">
      {claim.replies.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Belum ada balasan di percakapan ini.
        </p>
      ) : (
        <ul
          className="flex max-h-[min(520px,60vh)] flex-col gap-4 overflow-y-auto pr-1"
          aria-label="Thread percakapan klaim"
        >
          {claim.replies.map((r) => {
            const staff = Boolean(r.author?.is_staff);
            return (
              <li key={r.id} className={cn("flex", staff ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[min(100%,32rem)] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    staff
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-900"
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 flex flex-wrap items-center gap-2 text-xs",
                      staff ? "text-blue-100" : "text-muted-foreground"
                    )}
                  >
                    <span className="font-semibold">
                      {staff
                        ? r.author?.name
                          ? `Tim BhisaKirim · ${r.author.name}`
                          : "Tim BhisaKirim"
                        : (r.author?.name ?? "Pengaju")}
                    </span>
                    <time dateTime={r.created_at}>{formatClaimDateTime(r.created_at)}</time>
                  </div>
                  {r.message && <p className="whitespace-pre-wrap break-words">{r.message}</p>}
                  {r.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.attachments.map((a) =>
                        (a.mime ?? "").startsWith("image/") ? (
                          <ClaimAttachmentImage key={a.id} attachment={a} />
                        ) : (
                          <div key={a.id} className="w-full">
                            <ClaimAttachmentLink attachment={a} />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canReply ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Tulis balasan…"
            rows={4}
            className="resize-y"
            disabled={sendingReply}
          />
          <div
            className={cn(
              "rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 transition-colors",
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
              handleReplyFilesChange(Array.from(e.dataTransfer.files ?? []));
            }}
          >
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <FileUp className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  Seret file atau klik untuk memilih
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  JPG, PNG, PDF · maks. {formatBytes(CLAIM_MAX_ATTACHMENT_BYTES)} per file ·
                  maks. {CLAIM_MAX_FILES} file
                </p>
              </div>
              <Input
                id="kp-reply-files"
                type="file"
                accept={CLAIM_ACCEPT_FILES}
                multiple
                disabled={sendingReply}
                className="sr-only"
                onChange={(e) => {
                  const list = e.target.files ? Array.from(e.target.files) : [];
                  handleReplyFilesChange(list);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sendingReply}
                className="shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => document.getElementById("kp-reply-files")?.click()}
              >
                Pilih file
              </Button>
            </div>
          </div>
          {replyFileHint ? (
            <p className="text-muted-foreground text-xs" role="status">
              {replyFileHint}
            </p>
          ) : null}
          {replyFiles.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Pratinjau lampiran">
              {replyPreviews.map((p, index) => (
                <li
                  key={`${p.file.name}-${p.file.size}-${index}`}
                  className="relative h-20 w-20 overflow-hidden rounded-lg border shadow-sm"
                >
                  {p.file.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- object URL lokal
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 text-slate-500">
                      <FileTextIcon className="h-6 w-6" aria-hidden />
                      <span className="px-1 text-center text-[10px] leading-tight">PDF</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeReplyFileAt(index)}
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
      ) : (
        <p className="text-muted-foreground border-t border-slate-100 pt-4 text-sm">
          Klaim sudah selesai ditangani. Tidak dapat menambah balasan baru.
        </p>
      )}
    </div>
  );
}

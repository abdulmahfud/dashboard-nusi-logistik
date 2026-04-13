"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { createSupportTicket } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { SUPPORT_DEPARTMENT_OPTIONS } from "@/lib/supportTicketUi";
import type { SupportDepartment } from "@/types/supportTicket";
import {
  SUPPORT_TICKET_ACCEPT_IMAGES,
  SUPPORT_TICKET_MAX_ATTACHMENT_BYTES,
  SUPPORT_TICKET_MAX_FILES,
  SUPPORT_TICKET_MESSAGE_MAX,
  SUPPORT_TICKET_TITLE_MAX,
  formatBytes,
  validateSupportTicketImageFiles,
} from "@/lib/support-ticket-upload";
import { cn } from "@/lib/utils";

const VALID_SUPPORT_DEPARTMENTS: ReadonlySet<SupportDepartment> = new Set([
  "billing",
  "expedition",
  "technical",
  "account",
  "other",
]);

function extractCreatedTicketId(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const data = p.data;
  if (data && typeof data === "object" && "id" in data) {
    const id = (data as { id?: unknown }).id;
    if (typeof id === "number") return id;
  }
  if (typeof p.id === "number") return p.id;
  return null;
}

type Props = {
  onSuccess?: (payload: { ticketId: number | null }) => void;
  navigateToDetail?: boolean;
  className?: string;
};

export function SupportTicketCreateForm({
  onSuccess,
  navigateToDetail = true,
  className,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<string>("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fileHint, setFileHint] = useState<string | null>(null);

  const titleLen = title.length;
  const messageLen = message.length;

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const handleFilesChange = (list: File[]) => {
    setFileHint(null);
    if (list.length === 0) {
      setFiles([]);
      return;
    }
    const v = validateSupportTicketImageFiles(list);
    v.info.forEach((m) => toast.info(m));
    if (!v.ok) {
      v.errors.forEach((m) => toast.error(m));
      setFiles([]);
      return;
    }
    setFiles(v.accepted);
    if (v.info.length) {
      setFileHint(v.info.join(" "));
    }
  };

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileHint(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    const t = title.trim();

    if (!t) {
      toast.error("Judul wajib diisi.");
      return;
    }
    if (t.length > SUPPORT_TICKET_TITLE_MAX) {
      toast.error(`Judul maksimal ${SUPPORT_TICKET_TITLE_MAX} karakter.`);
      return;
    }
    if (!department) {
      toast.error("Pilih departemen.");
      return;
    }
    if (!VALID_SUPPORT_DEPARTMENTS.has(department as SupportDepartment)) {
      toast.error(
        "Departemen tidak valid. Pilih: billing, expedition, technical, account, atau other."
      );
      return;
    }
    if (text.length > SUPPORT_TICKET_MESSAGE_MAX) {
      toast.error(`Pesan maksimal ${SUPPORT_TICKET_MESSAGE_MAX} karakter.`);
      return;
    }
    if (!text && files.length === 0) {
      toast.error("Isi pesan atau lampirkan minimal satu gambar.");
      return;
    }

    const recheck = validateSupportTicketImageFiles(files);
    if (!recheck.ok) {
      recheck.errors.forEach((m) => toast.error(m));
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", t);
      fd.append("department", department as SupportDepartment);
      if (text) fd.append("message", text);
      recheck.accepted.forEach((f) => fd.append("attachments[]", f));

      const res = await createSupportTicket(fd);
      const id = extractCreatedTicketId(res);
      toast.success("Tiket berhasil dibuat.");

      onSuccess?.({ ticketId: id });

      setTitle("");
      setDepartment("");
      setMessage("");
      setFiles([]);
      setFileHint(null);

      if (navigateToDetail && id != null) {
        router.push(`/dashboard/support/tickets/${id}`);
      }
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal membuat tiket.")
          : "Gagal membuat tiket."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="support-ticket-form"
      onSubmit={handleSubmit}
      className={className}
      noValidate
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="stf-title">Judul</Label>
            <span
              className={cn(
                "text-xs tabular-nums",
                titleLen > SUPPORT_TICKET_TITLE_MAX
                  ? "text-destructive font-medium"
                  : "text-muted-foreground"
              )}
              aria-live="polite"
            >
              {titleLen}/{SUPPORT_TICKET_TITLE_MAX}
            </span>
          </div>
          <Input
            id="stf-title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, SUPPORT_TICKET_TITLE_MAX))}
            placeholder="Ringkasan singkat masalah"
            maxLength={SUPPORT_TICKET_TITLE_MAX}
            required
            autoComplete="off"
            aria-invalid={titleLen > SUPPORT_TICKET_TITLE_MAX}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stf-dept">Departemen</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="stf-dept">
              <SelectValue placeholder="Pilih departemen" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORT_DEPARTMENT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="stf-msg">Pesan</Label>
            <span
              className={cn(
                "text-xs tabular-nums",
                messageLen > SUPPORT_TICKET_MESSAGE_MAX
                  ? "text-destructive font-medium"
                  : "text-muted-foreground"
              )}
              aria-live="polite"
            >
              {messageLen}/{SUPPORT_TICKET_MESSAGE_MAX}
            </span>
          </div>
          <Textarea
            id="stf-msg"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value.slice(0, SUPPORT_TICKET_MESSAGE_MAX))
            }
            placeholder="Ceritakan detail masalah, nomor order jika ada…"
            rows={5}
            className="min-h-[100px] resize-y"
            maxLength={SUPPORT_TICKET_MESSAGE_MAX}
            aria-invalid={messageLen > SUPPORT_TICKET_MESSAGE_MAX}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stf-files">Lampiran gambar (opsional)</Label>
          <div
            className={cn(
              "rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 transition-colors",
              "hover:border-blue-300 hover:bg-blue-50/40 focus-within:border-blue-400"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const dropped = Array.from(e.dataTransfer.files ?? []);
              handleFilesChange(dropped);
            }}
          >
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <ImagePlus className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  Seret file ke sini atau klik untuk memilih
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  JPEG, PNG, GIF, WebP, BMP · maks.{" "}
                  {formatBytes(SUPPORT_TICKET_MAX_ATTACHMENT_BYTES)} per file ·
                  maks. {SUPPORT_TICKET_MAX_FILES} file
                </p>
              </div>
              <Input
                id="stf-files"
                type="file"
                accept={SUPPORT_TICKET_ACCEPT_IMAGES}
                multiple
                className="sr-only"
                onChange={(e) => {
                  const list = e.target.files ? Array.from(e.target.files) : [];
                  handleFilesChange(list);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="blueGradientOutline"
                size="sm"
                className="shrink-0"
                onClick={() => document.getElementById("stf-files")?.click()}
              >
                Pilih gambar
              </Button>
            </div>
          </div>
          {fileHint ? (
            <p className="text-muted-foreground text-xs" role="status">
              {fileHint}
            </p>
          ) : null}
          {files.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2" aria-label="Pratinjau lampiran">
              {previews.map((p, index) => (
                <li
                  key={`${p.file.name}-${p.file.size}-${index}`}
                  className="relative overflow-hidden rounded-lg border bg-white shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- object URL lokal */}
                  <img
                    src={p.url}
                    alt=""
                    className="h-28 w-full object-cover"
                  />
                  <div className="flex items-start justify-between gap-2 p-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-800">
                        {p.file.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatBytes(p.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeFileAt(index)}
                      aria-label={`Hapus ${p.file.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="blueGradient"
          disabled={submitting}
          className="w-full gap-2 sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengirim…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Kirim tiket
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

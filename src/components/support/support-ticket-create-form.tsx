"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

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
  /** Setelah tiket berhasil dibuat (sebelum navigasi / reload). */
  onSuccess?: (payload: { ticketId: number | null }) => void;
  /** Jika false, tidak redirect ke halaman detail (untuk hanya refresh daftar). */
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!title.trim()) {
      toast.error("Judul wajib diisi.");
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
    if (!text && files.length === 0) {
      toast.error("Isi pesan atau lampirkan minimal satu gambar.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("department", department as SupportDepartment);
      if (text) fd.append("message", text);
      files.forEach((f) => fd.append("attachments[]", f));

      const res = await createSupportTicket(fd);
      const id = extractCreatedTicketId(res);
      toast.success("Tiket berhasil dibuat.");

      onSuccess?.({ ticketId: id });

      setTitle("");
      setDepartment("");
      setMessage("");
      setFiles([]);

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
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stf-title">Judul</Label>
          <Input
            id="stf-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ringkasan singkat masalah"
            maxLength={500}
            required
            autoComplete="off"
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
          <Label htmlFor="stf-msg">Pesan</Label>
          <Textarea
            id="stf-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ceritakan detail masalah, nomor order jika ada…"
            rows={5}
            className="min-h-[100px] resize-y"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stf-files">Lampiran gambar (opsional)</Label>
          <Input
            id="stf-files"
            type="file"
            accept="image/*"
            multiple
            className="cursor-pointer"
            onChange={(e) => {
              const list = e.target.files ? Array.from(e.target.files) : [];
              setFiles(list);
            }}
          />
          <p className="text-muted-foreground text-xs">
            Beberapa gambar diperbolehkan. Kosongkan pesan jika hanya mengirim
            gambar.
          </p>
          {files.length > 0 && (
            <ul className="text-sm text-slate-600">
              {files.map((f) => (
                <li key={f.name + f.size}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        <Button type="submit" variant="blueGradient" disabled={submitting} className="gap-2 w-full sm:w-auto">
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

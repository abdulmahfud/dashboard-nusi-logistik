"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Send,
  Settings2,
  Trash2,
  User,
  Headset,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SupportTicketStatusBadge } from "@/components/support/support-ticket-status-badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  getSupportTicket,
  patchSupportTicket,
  postSupportTicketMessage,
} from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { unwrapSupportTicketDetail } from "@/lib/supportTickets";
import {
  SUPPORT_STATUS_OPTIONS,
  formatTicketDateTime,
} from "@/lib/supportTicketUi";
import type {
  SupportTicketDetail,
  SupportTicketMessage,
  SupportTicketStatus,
} from "@/types/supportTicket";
import { SupportAttachmentImage } from "@/components/support/support-attachment-image";
import {
  SUPPORT_TICKET_ACCEPT_IMAGES,
  SUPPORT_TICKET_MAX_ATTACHMENT_BYTES,
  SUPPORT_TICKET_MAX_FILES,
  SUPPORT_TICKET_MESSAGE_MAX,
  formatBytes,
  validateSupportTicketImageFiles,
} from "@/lib/support-ticket-upload";
import { cn } from "@/lib/utils";

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const ticketId =
    typeof idParam === "string"
      ? Number(idParam)
      : Array.isArray(idParam)
        ? Number(idParam[0])
        : NaN;

  const { loading: authLoading, hasPermission } = useAuth();
  const canView = hasPermission("support.tickets.view");
  const canManage = hasPermission("support.tickets.manage");
  const canReply = hasPermission("support.tickets.reply");
  const canAccess = canView || canManage;

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replyFileHint, setReplyFileHint] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);

  const replyPreviews = useMemo(
    () =>
      replyFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
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
    const v = validateSupportTicketImageFiles(list);
    v.info.forEach((m) => toast.info(m));
    if (!v.ok) {
      v.errors.forEach((m) => toast.error(m));
      setReplyFiles([]);
      return;
    }
    setReplyFiles(v.accepted);
    if (v.info.length) {
      setReplyFileHint(v.info.join(" "));
    }
  };

  const removeReplyFileAt = (index: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
    setReplyFileHint(null);
  };

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminStatus, setAdminStatus] = useState<string>("");
  const [adminAssign, setAdminAssign] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard/support/tickets/new");
  }, [router]);

  const load = useCallback(async () => {
    if (!Number.isFinite(ticketId) || ticketId < 1) {
      setError("Tiket tidak valid.");
      setLoading(false);
      return;
    }
    if (!canAccess) return;

    setLoading(true);
    setError(null);
    try {
      const raw = await getSupportTicket(ticketId);
      const t = unwrapSupportTicketDetail(raw);
      if (!t) {
        setError("Data tiket tidak ditemukan.");
        setTicket(null);
        return;
      }
      setTicket(t);
      setAdminStatus(String(t.status));
      setAdminAssign(
        t.assigned_to != null && t.assigned_to !== undefined
          ? String(t.assigned_to)
          : ""
      );
    } catch (e) {
      const msg =
        e instanceof AxiosError
          ? getAxiosErrorMessage(e, "Gagal memuat tiket.")
          : "Gagal memuat tiket.";
      setError(msg);
      setTicket(null);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [ticketId, canAccess]);

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

  const messages: SupportTicketMessage[] = Array.isArray(ticket?.messages)
    ? [...ticket.messages].sort((a, b) =>
        String(a.created_at).localeCompare(String(b.created_at))
      )
    : [];

  const isClosed =
    String(ticket?.status).toLowerCase() === "closed" ||
    ticket?.closed_at != null;

  const allowReply = canReply && ticket != null && !isClosed;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !allowReply) return;
    const text = replyText.trim();
    if (!text && replyFiles.length === 0) {
      toast.error("Tulis pesan atau lampirkan gambar.");
      return;
    }
    if (text.length > SUPPORT_TICKET_MESSAGE_MAX) {
      toast.error(`Pesan maksimal ${SUPPORT_TICKET_MESSAGE_MAX} karakter.`);
      return;
    }
    const recheck = validateSupportTicketImageFiles(replyFiles);
    if (!recheck.ok) {
      recheck.errors.forEach((m) => toast.error(m));
      return;
    }
    setReplying(true);
    try {
      const fd = new FormData();
      if (text) fd.append("message", text);
      recheck.accepted.forEach((f) => fd.append("attachments[]", f));
      await postSupportTicketMessage(ticket.id, fd);
      toast.success("Balasan terkirim.");
      setReplyText("");
      setReplyFiles([]);
      setReplyFileHint(null);
      await load();
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal mengirim balasan.")
          : "Gagal mengirim balasan."
      );
    } finally {
      setReplying(false);
    }
  };

  const handleAdminSave = async () => {
    if (!ticket || !canManage) return;
    setSavingAdmin(true);
    try {
      const body: {
        status?: SupportTicketStatus | string;
        assigned_to?: number | null;
      } = {};
      if (adminStatus && adminStatus !== String(ticket.status)) {
        body.status = adminStatus;
      }
      const trimmed = adminAssign.trim();
      if (trimmed === "") {
        if (ticket.assigned_to != null) body.assigned_to = null;
      } else {
        const n = Number(trimmed);
        if (!Number.isFinite(n)) {
          toast.error("User ID penugasan harus angka.");
          setSavingAdmin(false);
          return;
        }
        if (n !== ticket.assigned_to) body.assigned_to = n;
      }

      if (Object.keys(body).length === 0) {
        toast.info("Tidak ada perubahan.");
        setAdminOpen(false);
        return;
      }

      await patchSupportTicket(ticket.id, body);
      toast.success("Tiket diperbarui.");
      setAdminOpen(false);
      await load();
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal memperbarui tiket.")
          : "Gagal memperbarui tiket."
      );
    } finally {
      setSavingAdmin(false);
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
          ) : error || !ticket ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-red-600" role="alert">
                  {error ?? "Tiket tidak ditemukan."}
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
                      {ticket.title}
                    </h1>
                    <SupportTicketStatusBadge
                      status={String(ticket.status)}
                      statusLabel={ticket.status_label}
                    >
                      {ticket.status_label ?? ticket.status}
                    </SupportTicketStatusBadge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {ticket.department_label ?? ticket.department} · #
                    {ticket.id} · Pembaruan:{" "}
                    {formatTicketDateTime(ticket.updated_at ?? ticket.created_at)}
                  </p>
                  {ticket.user && (
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                      <User className="h-3.5 w-3.5" aria-hidden />
                      {ticket.user.name ?? "Pengguna"}{" "}
                      {ticket.user.email ? `· ${ticket.user.email}` : ""}
                    </p>
                  )}
                  {ticket.assignee && (
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                      <Headset className="h-3.5 w-3.5" aria-hidden />
                      Ditugaskan: {ticket.assignee.name ?? ticket.assignee.email}
                    </p>
                  )}
                </div>

                {canManage && (
                  <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="blueGradientOutline"
                        className="shrink-0 gap-2"
                      >
                        <Settings2 className="h-4 w-4" />
                        Kelola tiket
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Kelola tiket (admin)</DialogTitle>
                        <DialogDescription>
                          Ubah status atau penugasan ke staff (User ID).
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="adm-status">Status</Label>
                          <Select
                            value={adminStatus}
                            onValueChange={setAdminStatus}
                          >
                            <SelectTrigger id="adm-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORT_STATUS_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="adm-assign">Ditugaskan ke (User ID)</Label>
                          <Input
                            id="adm-assign"
                            inputMode="numeric"
                            placeholder="Kosongkan untuk menghapus penugasan"
                            value={adminAssign}
                            onChange={(e) =>
                              setAdminAssign(e.target.value.replace(/\D/g, ""))
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          type="button"
                          variant="blueGradientOutline"
                          onClick={() => setAdminOpen(false)}
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void handleAdminSave()}
                          disabled={savingAdmin}
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
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Percakapan</CardTitle>
                  <CardDescription>
                    Pesan diurutkan berdasarkan waktu. Staff ditandai dengan
                    warna berbeda.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messages.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      Belum ada pesan di thread ini.
                    </p>
                  ) : (
                    <ul
                      className="flex max-h-[min(520px,70vh)] flex-col gap-4 overflow-y-auto pr-1"
                      aria-label="Thread percakapan"
                    >
                      {messages.map((m) => {
                        const staff = Boolean(m.author?.is_staff);
                        return (
                          <li
                            key={m.id}
                            className={`flex ${staff ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                staff
                                  ? "bg-blue-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-900"
                              }`}
                            >
                              <div
                                className={`mb-1 flex flex-wrap items-center gap-2 text-xs ${
                                  staff
                                    ? "text-blue-100"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <span className="font-semibold">
                                  {staff
                                    ? m.author?.name
                                      ? `Tim support · ${m.author.name}`
                                      : "Tim support"
                                    : m.author?.name ?? "Pelanggan"}
                                </span>
                                <span className="sr-only">Waktu:</span>
                                <time dateTime={m.created_at}>
                                  {formatTicketDateTime(m.created_at)}
                                </time>
                              </div>
                              {m.body ? (
                                <p className="whitespace-pre-wrap break-words">
                                  {m.body}
                                </p>
                              ) : (
                                <p
                                  className={
                                    staff ? "text-blue-100" : "text-muted-foreground"
                                  }
                                >
                                  (Lampiran saja)
                                </p>
                              )}
                              {m.attachments && m.attachments.length > 0 ? (
                                <div className="mt-3 flex flex-col gap-2">
                                  {m.attachments.map((a) => (
                                    <SupportAttachmentImage
                                      key={`${a.id}-${a.url ?? ""}`}
                                      ticketId={ticket.id}
                                      attachmentId={a.id}
                                      attachmentUrl={a.url}
                                      alt={a.original_name ?? "Lampiran"}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {isClosed ? (
                <Card className="border-amber-200 bg-amber-50/80">
                  <CardContent className="py-4 text-sm text-amber-900">
                    Tiket ini sudah ditutup. Anda tidak dapat menambah pesan
                    baru.
                  </CardContent>
                </Card>
              ) : !canReply ? (
                <Card>
                  <CardContent className="text-muted-foreground py-4 text-sm">
                    Anda tidak memiliki izin untuk membalas tiket ini (
                    <span className="font-mono">support.tickets.reply</span>).
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Balas</CardTitle>
                    <CardDescription>
                      Tulis pesan dan/atau lampirkan gambar. Kosongkan teks jika
                      hanya mengirim gambar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleReply} className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor="reply-msg">Pesan</Label>
                          <span
                            className={cn(
                              "text-xs tabular-nums",
                              replyText.length > SUPPORT_TICKET_MESSAGE_MAX
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            )}
                            aria-live="polite"
                          >
                            {replyText.length}/{SUPPORT_TICKET_MESSAGE_MAX}
                          </span>
                        </div>
                        <Textarea
                          id="reply-msg"
                          value={replyText}
                          onChange={(e) =>
                            setReplyText(
                              e.target.value.slice(0, SUPPORT_TICKET_MESSAGE_MAX)
                            )
                          }
                          placeholder="Ketik balasan…"
                          rows={4}
                          className="resize-y min-h-[96px]"
                          maxLength={SUPPORT_TICKET_MESSAGE_MAX}
                          disabled={replying}
                          aria-invalid={
                            replyText.length > SUPPORT_TICKET_MESSAGE_MAX
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reply-files-input">
                          Lampiran gambar (opsional)
                        </Label>
                        <div
                          className={cn(
                            "rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 transition-colors",
                            "hover:border-blue-300 hover:bg-blue-50/40 focus-within:border-blue-400",
                            replying && "pointer-events-none opacity-60"
                          )}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (replying) return;
                            const dropped = Array.from(
                              e.dataTransfer.files ?? []
                            );
                            handleReplyFilesChange(dropped);
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
                                {formatBytes(SUPPORT_TICKET_MAX_ATTACHMENT_BYTES)}{" "}
                                per file · maks. {SUPPORT_TICKET_MAX_FILES} file
                              </p>
                            </div>
                            <Input
                              id="reply-files-input"
                              type="file"
                              accept={SUPPORT_TICKET_ACCEPT_IMAGES}
                              multiple
                              className="sr-only"
                              disabled={replying}
                              onChange={(e) => {
                                const list = e.target.files
                                  ? Array.from(e.target.files)
                                  : [];
                                handleReplyFilesChange(list);
                                e.target.value = "";
                              }}
                            />
                            <Button
                              type="button"
                              variant="blueGradientOutline"
                              size="sm"
                              className="shrink-0"
                              disabled={replying}
                              onClick={() =>
                                document
                                  .getElementById("reply-files-input")
                                  ?.click()
                              }
                            >
                              Pilih gambar
                            </Button>
                          </div>
                        </div>
                        {replyFileHint ? (
                          <p
                            className="text-muted-foreground text-xs"
                            role="status"
                          >
                            {replyFileHint}
                          </p>
                        ) : null}
                        {replyFiles.length > 0 ? (
                          <ul
                            className="grid gap-3 sm:grid-cols-2"
                            aria-label="Pratinjau lampiran"
                          >
                            {replyPreviews.map((p, index) => (
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
                                    disabled={replying}
                                    onClick={() => removeReplyFileAt(index)}
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
                        disabled={replying}
                        variant="blueGradient"
                      >
                        {replying ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mengirim…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Kirim balasan
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

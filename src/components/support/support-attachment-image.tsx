"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Props = {
  ticketId: number;
  attachmentId?: number;
  attachmentUrl?: string;
  alt: string;
  className?: string;
};

export function SupportAttachmentImage({
  ticketId,
  attachmentId,
  attachmentUrl,
  alt,
  className,
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    let blobUrl: string | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const requestPath =
          attachmentUrl && attachmentUrl.trim()
            ? attachmentUrl
            : `/admin/support/tickets/${ticketId}/attachments/${attachmentId}`;
        const res = await apiClient.get<Blob>(
          requestPath,
          { responseType: "blob" }
        );
        if (cancelled) return;
        blobUrl = URL.createObjectURL(res.data);
        setUrl(blobUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [ticketId, attachmentId, attachmentUrl]);

  if (failed) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <ImageIcon className="h-3.5 w-3.5" aria-hidden />
        Gagal memuat lampiran
      </span>
    );
  }

  if (!url) {
    return (
      <div
        className="h-32 w-full max-w-xs animate-pulse rounded-md bg-muted"
        aria-hidden
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomOpen(true)}
        className="inline-flex cursor-zoom-in rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label={`Perbesar gambar ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL dari API autentikasi */}
        <img
          src={url}
          alt={alt}
          className={
            className ??
            "max-h-56 max-w-full rounded-lg border border-slate-200 object-contain shadow-sm"
          }
        />
      </button>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-auto p-3 sm:p-4">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL dari API autentikasi */}
          <img
            src={url}
            alt={alt}
            className="h-auto max-h-[82vh] w-full rounded-md object-contain"
          />
          <div className="mt-3 flex justify-end">
            <a
              href={url}
              download={alt || "lampiran"}
              className="text-sm font-medium text-blue-600 underline underline-offset-2"
            >
              Unduh gambar
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

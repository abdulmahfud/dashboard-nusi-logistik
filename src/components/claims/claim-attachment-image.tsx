"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

import apiClient from "@/lib/apiClient";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PackageClaimAttachment } from "@/types/packageClaim";

type Props = {
  attachment: PackageClaimAttachment;
};

/** Thumbnail gambar lampiran klaim (pengajuan atau balasan) - endpoint private, ambil via blob lalu bisa diperbesar. */
export function ClaimAttachmentImage({ attachment }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    let blobUrl: string | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const res = await apiClient.get<Blob>(attachment.url, { responseType: "blob" });
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
  }, [attachment.url]);

  if (failed) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <ImageIcon className="h-3.5 w-3.5" aria-hidden />
        Gagal memuat gambar
      </span>
    );
  }

  if (!url) {
    return <div className="h-20 w-20 animate-pulse rounded-lg bg-muted" aria-hidden />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomOpen(true)}
        className="inline-flex cursor-zoom-in rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label={`Perbesar gambar ${attachment.original_name ?? "lampiran"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL dari API autentikasi */}
        <img
          src={url}
          alt={attachment.original_name ?? "Lampiran"}
          className="h-20 w-20 rounded-lg border border-slate-200 object-cover shadow-sm"
        />
      </button>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto p-3 sm:p-4">
          <DialogTitle className="sr-only">
            {attachment.original_name ?? "Lampiran"}
          </DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL dari API autentikasi */}
          <img
            src={url}
            alt={attachment.original_name ?? "Lampiran"}
            className="h-auto max-h-[80vh] w-full rounded-md object-contain"
          />
          <div className="mt-3 flex justify-end">
            <a
              href={url}
              download={attachment.original_name || "lampiran"}
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

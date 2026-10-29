"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { FileText, ImageIcon, Loader2 } from "lucide-react";

import apiClient from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { formatBytes } from "@/lib/claim-upload";
import type { PackageClaimAttachment } from "@/types/packageClaim";

type Props = {
  attachment: PackageClaimAttachment;
};

/** Lampiran klaim bisa gambar atau PDF — unduh via blob (endpoint private, perlu Bearer). */
export function ClaimAttachmentLink({ attachment }: Props) {
  const [loading, setLoading] = useState(false);
  const isImage = (attachment.mime ?? "").startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Blob>(attachment.url, {
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = attachment.original_name ?? "lampiran";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal mengunduh lampiran.")
          : "Gagal mengunduh lampiran."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={loading}
      className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
      ) : (
        <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      )}
      <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
        {attachment.original_name ?? "Lampiran"}
      </span>
      {attachment.size ? (
        <span className="shrink-0 text-xs text-slate-400">
          {formatBytes(attachment.size)}
        </span>
      ) : null}
    </button>
  );
}

import {
  CheckCircle2,
  Clock,
  FileText,
  Send,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export const CLAIM_ISSUE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "paket_hilang", label: "Paket Hilang" },
  { value: "paket_rusak", label: "Paket Rusak" },
  { value: "tidak_diterima", label: "Paket Tidak Diterima" },
  { value: "keterlambatan", label: "Keterlambatan" },
  { value: "lainnya", label: "Lainnya" },
];

export const CLAIM_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "diajukan", label: "Diajukan" },
  { value: "dalam_pemeriksaan", label: "Dalam Pemeriksaan" },
  { value: "menunggu_dokumen", label: "Menunggu Dokumen" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
  { value: "selesai", label: "Selesai" },
];

/** Status final yang bisa diubah oleh staff (claims.manage) lewat dialog detail. */
export const CLAIM_STATUS_UPDATE_OPTIONS = CLAIM_STATUS_OPTIONS;

export function claimStatusLabel(
  status: string,
  statusLabel?: string | null
): string {
  if (statusLabel) return statusLabel;
  return (
    CLAIM_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

export function claimIssueTypeLabel(
  issueType: string,
  issueTypeLabel?: string | null
): string {
  if (issueTypeLabel) return issueTypeLabel;
  return (
    CLAIM_ISSUE_TYPE_OPTIONS.find((o) => o.value === issueType)?.label ??
    issueType
  );
}

/**
 * Class Tailwind pill badge status: ikon + latar lembut senada warna (bukan
 * gradien tebal) - mengikuti referensi desain kartu "Riwayat Klaim Paket".
 */
export function claimStatusBadgeClassName(status: string): string {
  switch (status) {
    case "diajukan":
      return "border-sky-100 bg-sky-50 text-sky-600";
    case "dalam_pemeriksaan":
      return "border-orange-100 bg-orange-50 text-orange-600";
    case "menunggu_dokumen":
      return "border-amber-100 bg-amber-50 text-amber-600";
    case "disetujui":
      return "border-emerald-100 bg-emerald-50 text-emerald-600";
    case "ditolak":
      return "border-rose-100 bg-rose-50 text-rose-600";
    case "selesai":
      return "border-violet-100 bg-violet-50 text-violet-600";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

/** Ikon pill badge status, selaras dengan warna di claimStatusBadgeClassName(). */
export function claimStatusIcon(status: string): LucideIcon {
  switch (status) {
    case "diajukan":
      return Send;
    case "dalam_pemeriksaan":
      return Clock;
    case "menunggu_dokumen":
      return FileText;
    case "disetujui":
      return CheckCircle2;
    case "ditolak":
      return XCircle;
    case "selesai":
      return ShieldCheck;
    default:
      return FileText;
  }
}

export function formatClaimDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

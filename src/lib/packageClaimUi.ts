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

/** Class Tailwind badge status, selaras dengan warna di mockup. */
export function claimStatusBadgeClassName(status: string): string {
  switch (status) {
    case "diajukan":
      return [
        "border-sky-400/50",
        "bg-gradient-to-r from-sky-200/80 via-sky-100 to-blue-100",
        "!text-sky-950",
        "shadow-sm ring-1 ring-sky-400/35",
      ].join(" ");
    case "dalam_pemeriksaan":
      return [
        "border-amber-400/50",
        "bg-gradient-to-r from-amber-200/90 via-amber-100 to-orange-100",
        "!text-amber-950",
        "shadow-sm ring-1 ring-amber-400/30",
      ].join(" ");
    case "menunggu_dokumen":
      return [
        "border-orange-400/50",
        "bg-gradient-to-r from-orange-200/90 via-orange-100 to-amber-100",
        "!text-orange-950",
        "shadow-sm ring-1 ring-orange-400/30",
      ].join(" ");
    case "disetujui":
      return [
        "border-emerald-400/45",
        "bg-gradient-to-r from-emerald-200/80 to-green-100",
        "!text-emerald-950",
        "shadow-sm ring-1 ring-emerald-400/30",
      ].join(" ");
    case "ditolak":
      return [
        "border-rose-400/50",
        "bg-gradient-to-r from-rose-200/90 via-rose-100 to-red-100",
        "!text-rose-950",
        "shadow-sm ring-1 ring-rose-400/30",
      ].join(" ");
    case "selesai":
      return [
        "border-slate-400/50",
        "bg-gradient-to-r from-slate-300/90 to-slate-200/80",
        "!text-slate-900",
        "shadow-sm",
      ].join(" ");
    default:
      return "border-slate-200 bg-slate-100 !text-slate-800";
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

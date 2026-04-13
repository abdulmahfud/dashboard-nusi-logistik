export const SUPPORT_DEPARTMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "billing", label: "Billing / pembayaran" },
  { value: "expedition", label: "Ekspedisi / pengiriman" },
  { value: "technical", label: "Teknis" },
  { value: "account", label: "Akun" },
  { value: "other", label: "Lainnya" },
];

export const SUPPORT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "awaiting_support", label: "Menunggu tim support" },
  { value: "awaiting_customer", label: "Menunggu balasan Anda" },
  { value: "resolved", label: "Selesai" },
  { value: "closed", label: "Ditutup" },
];

/**
 * Normalisasi ke kode status internal (backend bisa kirim snake_case, label ID, dll.).
 */
export function resolveSupportTicketStatusKind(
  status: string,
  statusLabel?: string | null
):
  | "awaiting_support"
  | "awaiting_customer"
  | "resolved"
  | "closed"
  | "unknown" {
  const raw = String(status ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
  const label = String(statusLabel ?? "")
    .toLowerCase()
    .trim();
  const hay = `${raw} ${label}`;

  if (
    raw === "awaiting_support" ||
    raw.includes("awaiting_support") ||
    label.includes("menunggu tim") ||
    hay.includes("menunggu tim support")
  ) {
    return "awaiting_support";
  }
  if (
    raw === "awaiting_customer" ||
    raw.includes("awaiting_customer") ||
    label.includes("menunggu balasan") ||
    hay.includes("menunggu balasan anda")
  ) {
    return "awaiting_customer";
  }
  if (raw === "resolved" || label.includes("selesai")) {
    return "resolved";
  }
  if (raw === "closed" || label.includes("ditutup")) {
    return "closed";
  }
  return "unknown";
}

/** Class Tailwind untuk badge status (kode + opsional label dari API). */
export function supportTicketStatusBadgeClassName(
  status: string,
  statusLabel?: string | null
): string {
  const kind = resolveSupportTicketStatusKind(status, statusLabel);
  switch (kind) {
    case "awaiting_support":
      return [
        "border-amber-400/50",
        "bg-gradient-to-r from-amber-200/90 via-amber-100 to-orange-100",
        "!text-amber-950",
        "shadow-sm ring-1 ring-amber-400/30",
      ].join(" ");
    case "awaiting_customer":
      return [
        "border-sky-400/50",
        "bg-gradient-to-r from-sky-200/80 via-sky-100 to-blue-100",
        "!text-sky-950",
        "shadow-sm ring-1 ring-sky-400/35",
      ].join(" ");
    case "resolved":
      return [
        "border-emerald-400/45",
        "bg-gradient-to-r from-emerald-200/80 to-green-100",
        "!text-emerald-950",
        "shadow-sm ring-1 ring-emerald-400/30",
      ].join(" ");
    case "closed":
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

export function formatTicketDateTime(iso: string | null | undefined): string {
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

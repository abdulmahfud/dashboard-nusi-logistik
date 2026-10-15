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
 * Skala prioritas tiket bantuan — sama persis dengan Diskon Pengiriman &
 * Flat Ongkir (lihat src/lib/priorityScale.ts). Angka lebih kecil = lebih
 * tinggi. Hanya staf (support.tickets.manage) yang bisa mengubahnya; default
 * tiket baru selalu 3 (Sedang). Lihat docs/be-fe/update-prioritas-tiket-bantuan.md
 */
export const SUPPORT_PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "1 — Tertinggi" },
  { value: "2", label: "2 — Tinggi" },
  { value: "3", label: "3 — Sedang" },
  { value: "4", label: "4 — Rendah" },
  { value: "5", label: "5 — Terendah" },
];

export const DEFAULT_SUPPORT_TICKET_PRIORITY = 3;

/**
 * Opsi prioritas yang dipilih pelapor sendiri saat membuat tiket (form
 * submit) — 4 label saja, bukan skala admin 1-5 di atas. Value yang dikirim
 * tetap angka 1-5 yang sama ke BE: Mendesak=1, Tinggi=2, Sedang=3, Rendah=4.
 * Level 5 ("Terendah") sengaja tidak ditawarkan di sini, cuma bisa diset
 * staf lewat manajemen tiket. Lihat docs/be-fe/update-prioritas-tiket-bantuan.md
 */
export const SUPPORT_TICKET_CREATE_PRIORITY_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: "4", label: "Rendah" },
  { value: "3", label: "Sedang" },
  { value: "2", label: "Tinggi" },
  { value: "1", label: "Mendesak" },
];

export const DEFAULT_SUPPORT_TICKET_CREATE_PRIORITY = "3";

const SUPPORT_PRIORITY_LABEL: Record<number, string> = {
  1: "Tertinggi",
  2: "Tinggi",
  3: "Sedang",
  4: "Rendah",
  5: "Terendah",
};

/** Label Indonesia untuk angka prioritas; pakai label dari API kalau ada. */
export function supportTicketPriorityLabel(
  priority: number | string | null | undefined,
  priorityLabel?: string | null
): string {
  if (priorityLabel) return priorityLabel;
  const n =
    typeof priority === "number" ? priority : Number(priority ?? NaN);
  return SUPPORT_PRIORITY_LABEL[n] ?? "—";
}

/** Class Tailwind badge prioritas: 1–2 merah/oranye, 3 kuning/netral, 4–5 hijau/abu. */
export function supportTicketPriorityBadgeClassName(
  priority: number | string | null | undefined
): string {
  const n =
    typeof priority === "number" ? priority : Number(priority ?? NaN);
  switch (n) {
    case 1:
      return [
        "border-rose-400/50",
        "bg-gradient-to-r from-rose-200/90 via-rose-100 to-red-100",
        "!text-rose-950",
        "shadow-sm ring-1 ring-rose-400/30",
      ].join(" ");
    case 2:
      return [
        "border-orange-400/50",
        "bg-gradient-to-r from-orange-200/90 via-orange-100 to-amber-100",
        "!text-orange-950",
        "shadow-sm ring-1 ring-orange-400/30",
      ].join(" ");
    case 4:
      return [
        "border-emerald-400/45",
        "bg-gradient-to-r from-emerald-200/70 to-green-100",
        "!text-emerald-950",
        "shadow-sm ring-1 ring-emerald-400/25",
      ].join(" ");
    case 5:
      return [
        "border-slate-400/50",
        "bg-gradient-to-r from-slate-300/80 to-slate-200/70",
        "!text-slate-900",
        "shadow-sm",
      ].join(" ");
    case 3:
      return "border-amber-300/60 bg-amber-50 !text-amber-900 shadow-sm";
    default:
      return "border-slate-200 bg-slate-100 !text-slate-800";
  }
}

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

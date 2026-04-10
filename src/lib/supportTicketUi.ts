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

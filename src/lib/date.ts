export type DateInput = Date | string | number | null | undefined;

const idLongDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/**
 * Format tanggal Indonesia: "08 April 2026".
 * Mengembalikan "—" jika input tidak valid.
 */
export function formatDateIdLong(value: DateInput): string {
  if (value === undefined || value === null || value === "") return "—";

  const d =
    value instanceof Date ? value : typeof value === "number" ? new Date(value) : new Date(String(value));

  if (Number.isNaN(d.getTime())) return "—";
  return idLongDateFormatter.format(d);
}


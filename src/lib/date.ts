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

/**
 * Pisah tanggal & jam untuk tampilan dua baris: { date: "16 Juli 2026", time: "14:30:22" }.
 * Mengembalikan null jika input tidak valid.
 */
export function formatDateTimeId(
  value: DateInput
): { date: string; time: string } | null {
  if (value === undefined || value === null || value === "") return null;

  const d =
    value instanceof Date ? value : typeof value === "number" ? new Date(value) : new Date(String(value));

  if (Number.isNaN(d.getTime())) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: idLongDateFormatter.format(d),
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  };
}


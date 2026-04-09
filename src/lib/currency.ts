export type CurrencyInput = number | string | null | undefined;

const idIntegerFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function formatRupiah(value: CurrencyInput): string {
  if (value === null || value === undefined || value === "") return "Rp 0";

  const raw =
    typeof value === "string"
      ? value.replace(/\s/g, "").replace(/,/g, ".")
      : value;
  const numeric = Number(raw);

  if (!Number.isFinite(numeric)) return "Rp 0";

  const abs = Math.abs(Math.trunc(numeric));
  const sign = numeric < 0 ? "-" : "";
  return `${sign}Rp ${idIntegerFormatter.format(abs)}`;
}


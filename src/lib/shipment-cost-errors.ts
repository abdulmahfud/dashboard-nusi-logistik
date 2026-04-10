import { AxiosError } from "axios";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/lib/apiError";

/**
 * Setelah Promise.allSettled pada cek ongkir paralel: tampilkan toast untuk
 * vendor yang gagal dengan HTTP 422 (vendor/COD dinonaktifkan).
 */
export function notifyShipmentCost422Rejections(
  entries: Array<{ label: string; settled: PromiseSettledResult<unknown> }>
): void {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const { label, settled } of entries) {
    if (settled.status !== "rejected") continue;
    const err = settled.reason;
    if (!(err instanceof AxiosError)) continue;
    if (err.response?.status !== 422) continue;
    const msg = getAxiosErrorMessage(err, "").trim();
    if (!msg) continue;
    const key = `${label}:${msg}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`${label}: ${msg}`);
  }

  if (lines.length === 0) return;

  if (lines.length === 1) {
    toast.error(lines[0]);
    return;
  }

  toast.error("Beberapa layanan ekspedisi tidak tersedia", {
    description: lines.slice(0, 8).join("\n"),
  });
}

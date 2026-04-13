import { AxiosError } from "axios";

/**
 * Ambil pesan error dari response API (mis. 422) atau fallback.
 * Laravel 422: gabungkan message + errors.{field}[] tanpa menampilkan JSON mentah.
 */
export function getAxiosErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (typeof d.message === "string" && d.message.trim()) {
        const base = d.message.trim();
        const errors = d.errors;
        if (
          errors &&
          typeof errors === "object" &&
          errors !== null &&
          !Array.isArray(errors)
        ) {
          const parts: string[] = [];
          for (const v of Object.values(errors as Record<string, unknown>)) {
            if (Array.isArray(v)) {
              for (const item of v) {
                if (typeof item === "string" && item.trim()) parts.push(item.trim());
              }
            } else if (typeof v === "string" && v.trim()) {
              parts.push(v.trim());
            }
          }
          if (parts.length) {
            const extra = parts.filter((p) => !base.includes(p));
            if (extra.length) return `${base} ${extra.join(" ")}`.trim();
          }
        }
        return base;
      }
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

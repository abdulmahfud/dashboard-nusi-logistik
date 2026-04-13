/**
 * Batas upload lampiran tiket bantuan — selaras dengan validasi backend
 * (config support_tickets + Rule::image). Collection mendeskripsikan field
 * title/message dengan validation.max dan attachments[] berupa file gambar.
 */
export const SUPPORT_TICKET_TITLE_MAX = 255;
export const SUPPORT_TICKET_MESSAGE_MAX = 20000;
export const SUPPORT_TICKET_MAX_FILES = 5;
/** Per file, dalam byte (5120 KB) */
export const SUPPORT_TICKET_MAX_ATTACHMENT_BYTES = 5120 * 1024;

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
]);

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type SupportTicketFileValidationResult = {
  ok: boolean;
  accepted: File[];
  /** Peringatan non-blokir (mis. file dipotong ke batas maks.) */
  info: string[];
  /** Error per file / aturan */
  errors: string[];
};

/**
 * Validasi daftar file sebelum append ke FormData.
 * Jika lebih dari batas jumlah file, hanya file pertama yang divalidasi/dipakai.
 */
export function validateSupportTicketImageFiles(
  files: File[]
): SupportTicketFileValidationResult {
  const info: string[] = [];
  const errors: string[] = [];

  if (files.length > SUPPORT_TICKET_MAX_FILES) {
    info.push(
      `Hanya ${SUPPORT_TICKET_MAX_FILES} file pertama yang dipakai (${files.length} file dipilih).`
    );
  }

  const trimmed = files.slice(0, SUPPORT_TICKET_MAX_FILES);
  const accepted: File[] = [];

  for (const file of trimmed) {
    if (!ALLOWED_IMAGE_MIME.has(file.type)) {
      errors.push(
        `"${file.name}": gunakan JPEG, PNG, GIF, WebP, atau BMP.`
      );
      continue;
    }
    if (file.size > SUPPORT_TICKET_MAX_ATTACHMENT_BYTES) {
      errors.push(
        `"${file.name}": maks. ${formatBytes(SUPPORT_TICKET_MAX_ATTACHMENT_BYTES)} (ini ${formatBytes(file.size)}).`
      );
      continue;
    }
    accepted.push(file);
  }

  const ok = errors.length === 0 && accepted.length === trimmed.length;

  return {
    ok,
    accepted: ok ? accepted : [],
    info,
    errors,
  };
}

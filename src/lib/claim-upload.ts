/**
 * Batas upload lampiran Klaim Paket — selaras dengan validasi backend
 * (PackageClaimController::store: mimes:jpg,jpeg,png,pdf|max:5120, maks 5 file).
 * Beda dari tiket bantuan (support-ticket-upload.ts): di sini PDF juga
 * diizinkan sesuai mockup form klaim.
 */
export const CLAIM_TITLE_MAX = 255;
export const CLAIM_DESCRIPTION_MAX = 2000;
export const CLAIM_MAX_FILES = 5;
/** Per file, dalam byte (5120 KB) */
export const CLAIM_MAX_ATTACHMENT_BYTES = 5120 * 1024;

export const CLAIM_ACCEPT_FILES = "image/jpeg,image/jpg,image/png,application/pdf";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "application/pdf"]);

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ClaimFileValidationResult = {
  ok: boolean;
  accepted: File[];
  info: string[];
  errors: string[];
};

/**
 * Validasi daftar file sebelum append ke FormData - dipakai baik untuk
 * lampiran form pengajuan klaim maupun lampiran balasan (keduanya jpg/png/pdf,
 * maks 5 file, lihat PackageClaimController::store()/storeReply()).
 * Jika lebih dari batas jumlah file, hanya file pertama yang divalidasi/dipakai.
 */
export function validateClaimFiles(files: File[]): ClaimFileValidationResult {
  const info: string[] = [];
  const errors: string[] = [];

  if (files.length > CLAIM_MAX_FILES) {
    info.push(
      `Hanya ${CLAIM_MAX_FILES} file pertama yang dipakai (${files.length} file dipilih).`
    );
  }

  const trimmed = files.slice(0, CLAIM_MAX_FILES);
  const accepted: File[] = [];

  for (const file of trimmed) {
    if (!ALLOWED_MIME.has(file.type)) {
      errors.push(`"${file.name}": gunakan JPG, PNG, atau PDF.`);
      continue;
    }
    if (file.size > CLAIM_MAX_ATTACHMENT_BYTES) {
      errors.push(
        `"${file.name}": maks. ${formatBytes(CLAIM_MAX_ATTACHMENT_BYTES)} (ini ${formatBytes(file.size)}).`
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

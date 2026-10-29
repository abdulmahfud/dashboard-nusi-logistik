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

/**
 * Batas gambar balasan staff (claims.manage) pada klaim - beda dari lampiran
 * form pengajuan klaim di atas: hanya gambar (tanpa PDF), maks. 3 file,
 * selaras dengan PackageClaimController::storeReply().
 */
export const CLAIM_REPLY_MAX_FILES = 3;
export const CLAIM_REPLY_MAX_IMAGE_BYTES = 5120 * 1024;
export const CLAIM_REPLY_ACCEPT_IMAGES = "image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp";

const ALLOWED_REPLY_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
]);

export type ClaimFileValidationResult = {
  ok: boolean;
  accepted: File[];
  info: string[];
  errors: string[];
};

/** Validasi gambar balasan sebelum append ke FormData (lihat batas di atas). */
export function validateClaimReplyImages(files: File[]): ClaimFileValidationResult {
  const info: string[] = [];
  const errors: string[] = [];

  if (files.length > CLAIM_REPLY_MAX_FILES) {
    info.push(
      `Hanya ${CLAIM_REPLY_MAX_FILES} gambar pertama yang dipakai (${files.length} dipilih).`
    );
  }

  const trimmed = files.slice(0, CLAIM_REPLY_MAX_FILES);
  const accepted: File[] = [];

  for (const file of trimmed) {
    if (!ALLOWED_REPLY_IMAGE_MIME.has(file.type)) {
      errors.push(`"${file.name}": gunakan JPEG, PNG, GIF, WebP, atau BMP.`);
      continue;
    }
    if (file.size > CLAIM_REPLY_MAX_IMAGE_BYTES) {
      errors.push(
        `"${file.name}": maks. ${formatBytes(CLAIM_REPLY_MAX_IMAGE_BYTES)} (ini ${formatBytes(file.size)}).`
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

/**
 * Validasi daftar file sebelum append ke FormData.
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

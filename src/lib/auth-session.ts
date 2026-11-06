import { setCookie } from "cookies-next";
import { toast } from "sonner";
import { clearAdminMeCache } from "@/lib/admin-me";
import { setPendingVerificationEmail } from "@/lib/pending-verification-email";

const isDev = process.env.NODE_ENV === "development";

export type LoginPayload = {
  token: string | undefined;
  emailVerifiedAt: string | null | undefined;
  accountType: string | undefined;
  corporateApprovedAt: string | null | undefined;
  corporateRejectedReason: string | null | undefined;
};

/** Normalisasi bentuk respons login (flat vs nested `data`, token vs access_token). */
export function extractLoginPayload(data: unknown): LoginPayload {
  const empty: LoginPayload = {
    token: undefined,
    emailVerifiedAt: undefined,
    accountType: undefined,
    corporateApprovedAt: undefined,
    corporateRejectedReason: undefined,
  };
  if (!data || typeof data !== "object") {
    return empty;
  }
  const d = data as Record<string, unknown>;
  const tokenFrom = (obj: Record<string, unknown>): string | undefined => {
    const t = obj.token;
    const a = obj.access_token;
    if (typeof t === "string" && t) return t;
    if (typeof a === "string" && a) return a;
    return undefined;
  };

  let token = tokenFrom(d);
  let userRaw: unknown = d.user;

  const inner = d.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const innerObj = inner as Record<string, unknown>;
    token = token || tokenFrom(innerObj);
    if (userRaw == null) userRaw = innerObj.user;
  }

  let emailVerifiedAt: string | null | undefined;
  let accountType: string | undefined;
  let corporateApprovedAt: string | null | undefined;
  let corporateRejectedReason: string | null | undefined;
  if (userRaw && typeof userRaw === "object" && !Array.isArray(userRaw)) {
    const u = userRaw as Record<string, unknown>;
    const ev = u.email_verified_at;
    if (ev === null) emailVerifiedAt = null;
    else if (typeof ev === "string") emailVerifiedAt = ev;

    if (typeof u.account_type === "string") accountType = u.account_type;

    const ca = u.corporate_approved_at;
    if (ca === null) corporateApprovedAt = null;
    else if (typeof ca === "string") corporateApprovedAt = ca;

    const rr = u.corporate_rejected_reason;
    if (typeof rr === "string") corporateRejectedReason = rr;
  }

  return {
    token,
    emailVerifiedAt,
    accountType,
    corporateApprovedAt,
    corporateRejectedReason,
  };
}

/**
 * Simpan token dari respons login (password atau Google - keduanya
 * mengembalikan bentuk yang sama, lihat LoginController/GoogleAuthController)
 * lalu redirect ke tujuan yang sesuai status akun. Dipakai bersama oleh
 * LoginForm dan RegisterForm (tombol Google di keduanya langsung login,
 * bukan cuma daftar) supaya logikanya tidak diduplikasi.
 */
export function persistLoginAndRedirect(
  payload: LoginPayload,
  options?: { fallbackEmail?: string; callbackUrl?: string }
): void {
  const { token, emailVerifiedAt, accountType, corporateApprovedAt } = payload;
  if (!token) {
    throw new Error("Token tidak ditemukan di respons");
  }

  setCookie("token", token, {
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    secure: !isDev,
    sameSite: isDev ? "lax" : "strict",
    ...(isDev ? {} : { domain: ".bhisakirim.com" }),
  });
  // Hindari memakai cache /admin/me milik sesi sebelumnya (bisa memicu redirect salah).
  clearAdminMeCache();

  const isVerified =
    emailVerifiedAt != null && String(emailVerifiedAt).trim() !== "";
  if (!isVerified) {
    if (options?.fallbackEmail) setPendingVerificationEmail(options.fallbackEmail);
    toast.error(
      "Email belum diverifikasi. Silakan cek email verifikasi yang dikirimkan saat pendaftaran."
    );
    window.location.href = "/dashboard/verifikasi";
    return;
  }

  if (accountType === "corporate" && !corporateApprovedAt) {
    window.location.href = "/dashboard/menunggu-persetujuan";
    return;
  }

  window.location.href = options?.callbackUrl || "/dashboard";
  toast.success("Login berhasil!");
}

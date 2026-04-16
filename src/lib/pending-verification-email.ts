const KEY = "bhisakirim_pending_verify_email";

export function setPendingVerificationEmail(email: string): void {
  if (typeof window === "undefined") return;
  const t = email.trim();
  if (!t) return;
  sessionStorage.setItem(KEY, t);
}

export function getPendingVerificationEmail(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export function clearPendingVerificationEmail(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

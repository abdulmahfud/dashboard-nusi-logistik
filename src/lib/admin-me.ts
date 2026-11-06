import { isAxiosError } from "axios";
import apiClient from "@/lib/apiClient";
import type { ApiResponse, UserData } from "@/types/api";

function normalizePermissions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((p): p is string => typeof p === "string");
  }
  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>).filter(
      (p): p is string => typeof p === "string"
    );
  }
  return [];
}

function normalizeRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((r) => String(r)).filter(Boolean);
  }
  return [];
}

function normalizeUser(raw: UserData): UserData {
  return {
    ...raw,
    permissions: normalizePermissions(raw.permissions),
    roles: normalizeRoles(raw.roles),
  };
}

/** Hasil GET /admin/me — dipakai AuthContext / ProtectedRoute */
export type AdminMeErrorKind =
  | "none"
  | "unauthenticated"
  | "forbidden"
  | "unknown";

export type AdminMeFetchResult = {
  user: UserData | null;
  errorKind: AdminMeErrorKind;
  /**
   * `error_code` dari body 403 (lihat EnsureCorporateApproved) - dipakai
   * ProtectedRoute untuk membedakan "email belum verifikasi" (tidak ada
   * error_code) dari "akun corporate menunggu/ditolak persetujuan admin".
   */
  errorCode?: string;
  errorMessage?: string;
  corporateRejectedReason?: string | null;
};

let inflight: Promise<AdminMeFetchResult> | null = null;

let cached: AdminMeFetchResult & { at: number } | null = null;
const STALE_MS = 5 * 60 * 1000;

/**
 * GET /admin/me — dedupe inflight; cache 5 menit kecuali `force` (refresh manual / setelah update profil).
 * Panggil clearAdminMeCache() pada logout.
 */
export async function fetchAdminMe(options?: {
  force?: boolean;
}): Promise<AdminMeFetchResult> {
  const force = options?.force ?? false;

  if (inflight) {
    if (force) cached = null;
    return inflight;
  }

  if (force) cached = null;

  if (!force && cached && Date.now() - cached.at < STALE_MS) {
    return { user: cached.user, errorKind: cached.errorKind };
  }

  inflight = (async () => {
    try {
      const res = await apiClient.get<ApiResponse<UserData>>("/admin/me");
      const raw = res.data.data;
      const user = normalizeUser(raw);
      const result: AdminMeFetchResult = { user, errorKind: "none" };
      cached = { ...result, at: Date.now() };
      return result;
    } catch (e) {
      let errorKind: AdminMeErrorKind = "unknown";
      let errorCode: string | undefined;
      let errorMessage: string | undefined;
      let corporateRejectedReason: string | null | undefined;
      if (isAxiosError(e)) {
        const s = e.response?.status;
        if (s === 401 || s === 419) errorKind = "unauthenticated";
        else if (s === 403) {
          errorKind = "forbidden";
          const body = e.response?.data as Record<string, unknown> | undefined;
          if (body && typeof body.error_code === "string") {
            errorCode = body.error_code;
          }
          if (body && typeof body.message === "string") {
            errorMessage = body.message;
          }
          if (body && typeof body.corporate_rejected_reason === "string") {
            corporateRejectedReason = body.corporate_rejected_reason;
          }
        }
      }
      const result: AdminMeFetchResult = {
        user: null,
        errorKind,
        errorCode,
        errorMessage,
        corporateRejectedReason,
      };
      cached = { ...result, at: Date.now() };
      return result;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function clearAdminMeCache(): void {
  cached = null;
  inflight = null;
}

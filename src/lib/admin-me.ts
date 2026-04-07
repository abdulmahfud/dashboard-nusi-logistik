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

let inflight: Promise<UserData | null> | null = null;

let cached: { user: UserData | null; at: number } | null = null;
const STALE_MS = 5 * 60 * 1000;

/**
 * GET /admin/me — dedupe inflight; cache 5 menit kecuali `force` (refresh manual / setelah update profil).
 * Panggil clearAdminMeCache() pada logout.
 */
export async function fetchAdminMe(options?: {
  force?: boolean;
}): Promise<UserData | null> {
  const force = options?.force ?? false;

  // Dedupe dulu: meskipun force, kalau ada request berjalan, pakai yang itu.
  // Ini mencegah "force storm" (Strict Mode / multiple effects).
  if (inflight) {
    if (force) cached = null;
    return inflight;
  }

  if (force) cached = null;

  if (!force && cached && Date.now() - cached.at < STALE_MS) return cached.user;

  inflight = (async () => {
    try {
      const res = await apiClient.get<ApiResponse<UserData>>("/admin/me");
      const raw = res.data.data;
      const user = normalizeUser(raw);
      cached = { user, at: Date.now() };
      return user;
    } catch {
      cached = { user: null, at: Date.now() };
      return null;
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

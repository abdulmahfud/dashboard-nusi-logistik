/**
 * Filter item sidebar: wajib punya `permission` yang ada di GET /admin/me → data.permissions.
 * Atau `permissionAny`: salah satu izin cukup.
 * `requiresAccountType`, kalau diisi, item hanya tampil untuk account_type yang sama
 * (mis. "Riwayat Kredit" cuma untuk akun corporate, lihat sidebar-data.ts).
 * Saat auth masih loading, jangan tampilkan item (hindari flash atau izin salah).
 */
export function filterSidebarByPermission<
  T extends {
    permission?: string;
    permissionAny?: string[];
    requiresAccountType?: "personal" | "corporate";
  },
>(
  items: T[],
  hasPermission: (p: string) => boolean,
  authLoading: boolean,
  accountType?: "personal" | "corporate"
): T[] {
  if (authLoading) return [];
  return items.filter((item) => {
    if (item.requiresAccountType && item.requiresAccountType !== accountType) {
      return false;
    }
    if (item.permissionAny && item.permissionAny.length > 0) {
      return item.permissionAny.some((p) => hasPermission(p));
    }
    return (
      typeof item.permission === "string" &&
      item.permission.length > 0 &&
      hasPermission(item.permission)
    );
  });
}

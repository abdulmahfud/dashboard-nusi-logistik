/**
 * Filter item sidebar: wajib punya `permission` yang ada di GET /admin/me → data.permissions.
 * Atau `permissionAny`: salah satu izin cukup.
 * Saat auth masih loading, jangan tampilkan item (hindari flash atau izin salah).
 */
export function filterSidebarByPermission<
  T extends { permission?: string; permissionAny?: string[] },
>(items: T[], hasPermission: (p: string) => boolean, authLoading: boolean): T[] {
  if (authLoading) return [];
  return items.filter((item) => {
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

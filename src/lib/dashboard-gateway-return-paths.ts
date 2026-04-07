/**
 * Paths where users may land after external payment gateways (Xendit, etc.)
 * without the session cookie on the first request (e.g. SameSite=Strict).
 * Middleware and ProtectedRoute must align on these.
 */
export function isDashboardGatewayReturnPath(pathname: string): boolean {
  if (pathname.startsWith("/dashboard/payment/")) return true;
  return (
    pathname === "/dashboard/wallet/topup/success" ||
    pathname === "/dashboard/wallet/topup/failed"
  );
}

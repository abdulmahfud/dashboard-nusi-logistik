import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { isDashboardGatewayReturnPath } from "@/lib/dashboard-gateway-return-paths";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return new TextEncoder().encode(secret);
};

async function verifyJwtToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("token")?.value;
  if (!token) return false;

  const payload = await verifyJwtToken(token);
  if (
    !payload ||
    (payload.exp && payload.exp < Math.floor(Date.now() / 1000))
  ) {
    return false;
  }

  return true;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/register";
  const isDashboard = path.startsWith("/dashboard");
  const isGatewayReturnPage = isDashboardGatewayReturnPath(path);

  const authenticated = await isAuthenticated(request);

  // Jangan panggil GET /admin/me di sini — setiap navigasi memicu request dan mudah 429.
  // Status email_verifikasi ditangani di client (ProtectedRoute + AuthContext).

  if (isDashboard && !authenticated && !isGatewayReturnPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");

    return response;
  }

  if (isAuthPage && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};

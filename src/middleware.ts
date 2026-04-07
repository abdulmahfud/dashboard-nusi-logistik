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

async function isEmailVerified(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("token")?.value;
  if (!token) return false;

  try {
    // Use the same base URL as apiClient
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "https://api.bhisakirim.com/api";

    // Make API call to check user verification status
    const response = await fetch(`${API_URL}/admin/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const isVerified = !!data.data?.email_verified_at;

    return isVerified;
  } catch (error) {
    console.error("Error checking email verification:", error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/register";
  const isDashboard = path.startsWith("/dashboard");
  const isVerificationPage = path === "/dashboard/verifikasi";
  const isGatewayReturnPage = isDashboardGatewayReturnPath(path);

  const authenticated = await isAuthenticated(request);

  // If accessing dashboard and not authenticated, redirect to login
  // Exception: order payment + wallet top-up return URLs (external gateway may omit cookie on first request)
  if (isDashboard && !authenticated && !isGatewayReturnPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");

    return response;
  }

  // If authenticated and accessing auth pages, redirect to dashboard
  if (isAuthPage && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If authenticated but accessing dashboard (not verification page), check email verification
  if (authenticated && isDashboard && !isVerificationPage) {
    const emailVerified = await isEmailVerified(request);

    if (!emailVerified) {
      return NextResponse.redirect(
        new URL("/dashboard/verifikasi", request.url)
      );
    }
  }

  // If authenticated, verified, and accessing verification page, redirect to dashboard
  if (authenticated && isVerificationPage) {
    const emailVerified = await isEmailVerified(request);

    if (emailVerified) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};

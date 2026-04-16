"use client";

import { useAuth } from "@/context/AuthContext";
import { isDashboardGatewayReturnPath } from "@/lib/dashboard-gateway-return-paths";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "./ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, meErrorKind } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const allowWithoutUser = isDashboardGatewayReturnPath(pathname);

  const isVerifikasiPage = pathname === "/dashboard/verifikasi";

  /** /admin/me 403: token ada tapi profil ditolak (umumnya email belum verifikasi) — tetap boleh buka halaman verifikasi. */
  const allowVerifikasiWithForbiddenMe =
    isVerifikasiPage && meErrorKind === "forbidden";

  useEffect(() => {
    if (loading || allowWithoutUser) return;

    if (!user && meErrorKind === "unauthenticated") {
      router.replace("/login");
    }
  }, [loading, user, meErrorKind, allowWithoutUser, router]);

  useEffect(() => {
    if (loading || allowWithoutUser) return;

    if (user?.email_verified_at) return;

    if (user && !user.email_verified_at && !isVerifikasiPage) {
      router.replace("/dashboard/verifikasi");
      return;
    }

    if (!user && meErrorKind === "forbidden" && !isVerifikasiPage) {
      router.replace("/dashboard/verifikasi");
    }
  }, [
    loading,
    user,
    meErrorKind,
    isVerifikasiPage,
    allowWithoutUser,
    router,
  ]);

  if (loading && !allowWithoutUser) return <DashboardSkeleton />;

  if (!user && !allowWithoutUser) {
    if (allowVerifikasiWithForbiddenMe) return <>{children}</>;
    return <DashboardSkeleton />;
  }

  if (
    user &&
    !user.email_verified_at &&
    !isVerifikasiPage &&
    !allowWithoutUser
  ) {
    return <DashboardSkeleton />;
  }

  return <>{children}</>;
}

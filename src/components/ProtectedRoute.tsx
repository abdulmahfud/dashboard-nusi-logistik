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
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const allowWithoutUser = isDashboardGatewayReturnPath(pathname);

  const isVerifikasiPage = pathname === "/dashboard/verifikasi";

  useEffect(() => {
    if (!loading && !user && !allowWithoutUser) {
      router.push("/login");
    }
  }, [loading, user, router, allowWithoutUser]);

  useEffect(() => {
    if (
      loading ||
      !user ||
      user.email_verified_at ||
      isVerifikasiPage ||
      allowWithoutUser
    ) {
      return;
    }
    router.replace("/dashboard/verifikasi");
  }, [
    loading,
    user,
    isVerifikasiPage,
    allowWithoutUser,
    router,
  ]);

  if (loading) return <DashboardSkeleton />;

  if (!user && !allowWithoutUser) return <DashboardSkeleton />;

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

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

const CORPORATE_ERROR_CODES = new Set([
  "corporate_pending_approval",
  "corporate_rejected",
]);

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, meErrorKind, meErrorCode } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const allowWithoutUser = isDashboardGatewayReturnPath(pathname);

  const isVerifikasiPage = pathname === "/dashboard/verifikasi";
  const isMenungguPersetujuanPage =
    pathname === "/dashboard/menunggu-persetujuan";

  /** 403 karena akun corporate belum/ditolak disetujui admin - dibedakan dari "email belum verifikasi" lewat error_code (lihat EnsureCorporateApproved). */
  const isCorporatePendingError =
    meErrorKind === "forbidden" &&
    !!meErrorCode &&
    CORPORATE_ERROR_CODES.has(meErrorCode);

  /** /admin/me 403: token ada tapi profil ditolak (umumnya email belum verifikasi) — tetap boleh buka halaman verifikasi. */
  const allowVerifikasiWithForbiddenMe =
    isVerifikasiPage && meErrorKind === "forbidden" && !isCorporatePendingError;

  const allowMenungguPersetujuanWithForbiddenMe =
    isMenungguPersetujuanPage && isCorporatePendingError;

  useEffect(() => {
    if (loading || allowWithoutUser) return;

    if (!user && meErrorKind === "unauthenticated") {
      router.replace("/login");
    }
  }, [loading, user, meErrorKind, allowWithoutUser, router]);

  useEffect(() => {
    if (loading || allowWithoutUser) return;

    // Akun corporate pending/ditolak - gerbang ini didahulukan atas
    // pengecekan verifikasi email di bawah, meski urutan middleware BE
    // (verified lalu corporate.pending) memastikan error_code ini cuma
    // muncul setelah email terverifikasi.
    if (isCorporatePendingError && !isMenungguPersetujuanPage) {
      router.replace("/dashboard/menunggu-persetujuan");
      return;
    }

    if (user?.email_verified_at) return;

    if (user && !user.email_verified_at && !isVerifikasiPage) {
      router.replace("/dashboard/verifikasi");
      return;
    }

    if (
      !user &&
      meErrorKind === "forbidden" &&
      !isCorporatePendingError &&
      !isVerifikasiPage
    ) {
      router.replace("/dashboard/verifikasi");
    }
  }, [
    loading,
    user,
    meErrorKind,
    isCorporatePendingError,
    isVerifikasiPage,
    isMenungguPersetujuanPage,
    allowWithoutUser,
    router,
  ]);

  if (loading && !allowWithoutUser) return <DashboardSkeleton />;

  if (!user && !allowWithoutUser) {
    if (allowVerifikasiWithForbiddenMe || allowMenungguPersetujuanWithForbiddenMe) {
      return <>{children}</>;
    }
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

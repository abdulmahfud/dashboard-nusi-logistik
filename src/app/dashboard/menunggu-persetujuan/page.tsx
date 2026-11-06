"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, MessageCircle, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ApiService } from "@/lib/ApiService";

/**
 * Halaman penuh untuk akun corporate yang belum/ditolak disetujui admin
 * (lihat EnsureCorporateApproved di BE) - struktur sama persis
 * /dashboard/verifikasi (sama-sama "menunggu aksi eksternal"), bedanya
 * sumber datanya dari error_code 403 GET /admin/me (lewat AuthContext),
 * bukan payload sukses, karena /admin/me sendiri diblokir selama masih
 * pending/ditolak.
 */
export default function MenungguPersetujuanPage() {
  const {
    user,
    loading,
    meErrorCode,
    meCorporateRejectedReason,
    refreshUser,
  } = useAuth();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const isRejected = meErrorCode === "corporate_rejected";

  useEffect(() => {
    if (loading) return;
    setInitialCheckDone(true);
    // Sudah disetujui (user berhasil dimuat, bukan lagi 403) - lanjut ke dashboard.
    if (user?.account_type === "corporate" && user.corporate_approved_at) {
      window.location.href = "/dashboard";
    }
  }, [loading, user]);

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const userData = await refreshUser({ force: true });
      if (userData?.corporate_approved_at) {
        toast.success("Akun perusahaan Anda sudah disetujui!");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 100);
      } else {
        toast.info("Belum ada perubahan status. Silakan coba lagi nanti.");
      }
    } catch {
      toast.error("Gagal memeriksa status persetujuan.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
      toast.success("Logout berhasil");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Gagal logout. Silakan coba lagi.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100 p-4">
      {!initialCheckDone ? (
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Memeriksa status akun...</span>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div
              className={`mx-auto mb-4 w-fit rounded-full p-3 ${
                isRejected ? "bg-rose-100" : "bg-amber-100"
              }`}
            >
              {isRejected ? (
                <XCircle className="h-8 w-8 text-rose-600" />
              ) : (
                <Clock className="h-8 w-8 text-amber-600" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isRejected ? "Pendaftaran Ditolak" : "Menunggu Persetujuan Admin"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isRejected
                ? "Mohon maaf, pendaftaran akun perusahaan Anda belum dapat kami setujui."
                : "Akun perusahaan Anda sedang ditinjau oleh tim kami. Proses ini biasanya memakan waktu 1-2 hari kerja."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isRejected && meCorporateRejectedReason && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm font-medium text-rose-800">Alasan:</p>
                <p className="text-sm text-rose-700">
                  {meCorporateRejectedReason}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {!isRejected && (
                <Button
                  onClick={handleCheckStatus}
                  disabled={isCheckingStatus}
                  className="w-full gap-2"
                  variant="blueGradient"
                >
                  {isCheckingStatus ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isCheckingStatus ? "Memeriksa..." : "Cek Status"}
                </Button>
              )}

              <Button
                onClick={() => window.open("https://wa.me/6281330323559", "_blank")}
                variant="blueOutline"
                className="w-full gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Hubungi Admin
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full bg-red-500 text-white hover:bg-red-600 hover:text-white"
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

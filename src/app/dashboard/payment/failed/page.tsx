"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  XCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  Copy,
  RefreshCw,
  Clock,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getPaymentStatus } from "@/lib/apiClient";
import type { PaymentStatus } from "@/types/payment";

function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const referenceNo = searchParams.get("reference_no");
  const error = searchParams.get("error");

  const fetchPaymentStatus = useCallback(async () => {
    if (!referenceNo) return;

    try {
      setLoading(true);
      const result = await getPaymentStatus(referenceNo);

      if (result.success && result.data) {
        setPayment(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch payment status:", error);
    } finally {
      setLoading(false);
    }
  }, [referenceNo]);

  useEffect(() => {
    if (referenceNo) {
      fetchPaymentStatus();
    } else {
      setLoading(false);
    }
  }, [referenceNo, fetchPaymentStatus]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard");
  };

  const handleViewShipments = () => {
    router.push("/dashboard/laporan/laporan-pengiriman");
  };

  const handleTryAgain = () => {
    router.push("/dashboard/paket/paket-reguler");
  };

  const getFailureReason = () => {
    if (error) {
      switch (error) {
        case "expired":
          return "Waktu pembayaran telah habis (expired)";
        case "cancelled":
          return "Pembayaran dibatalkan oleh pengguna";
        case "failed":
          return "Transaksi pembayaran gagal";
        case "insufficient_funds":
          return "Saldo tidak mencukupi";
        case "card_declined":
          return "Kartu kredit/debit ditolak";
        case "network_error":
          return "Terjadi gangguan jaringan";
        default:
          return error;
      }
    }

    if (payment?.status === "expired") {
      return "Waktu pembayaran telah habis";
    }

    if (payment?.status === "failed") {
      return "Transaksi pembayaran gagal";
    }

    return "Terjadi kesalahan pada proses pembayaran";
  };

  const getStatusBadge = () => {
    const status =
      payment?.status || (error === "expired" ? "expired" : "failed");

    switch (status) {
      case "expired":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-4 py-2 text-sm font-medium">
            <Clock className="w-4 h-4 mr-2" />
            Status: Kadaluarsa
          </Badge>
        );
      case "failed":
      default:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 px-4 py-2 text-sm font-medium">
            <XCircle className="w-4 h-4 mr-2" />
            Status: Gagal
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat status pembayaran...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Failed Header */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pembayaran Gagal
              </h1>
              <p className="text-gray-600 text-lg">
                Maaf, terjadi kesalahan pada proses pembayaran Anda.
              </p>
            </div>

            {getStatusBadge()}
          </CardContent>
        </Card>

        {/* Error Details */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Detail Kesalahan
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-900">
                      Alasan Kegagalan
                    </h3>
                    <p className="text-red-700 text-sm mt-1">
                      {getFailureReason()}
                    </p>
                  </div>
                </div>
              </div>

              {payment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Reference Number
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="font-mono text-sm">
                        {payment.reference_no}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(payment.reference_no)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Jumlah Pembayaran
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg font-bold text-gray-700">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  </div>

                  {payment.created_at && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">
                        Waktu Percobaan Pembayaran
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">
                          {formatDate(payment.created_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
              Solusi yang Bisa Dicoba
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">
                    Periksa Koneksi Internet
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Pastikan koneksi internet Anda stabil dan coba lagi.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-green-600">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-green-900">
                    Periksa Saldo atau Limit
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Pastikan saldo e-wallet atau limit kartu kredit Anda
                    mencukupi.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-purple-600">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-purple-900">
                    Coba Metode Pembayaran Lain
                  </h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Gunakan metode pembayaran alternatif seperti bank transfer
                    atau e-wallet lainnya.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-orange-600">4</span>
                </div>
                <div>
                  <h3 className="font-medium text-orange-900">
                    Hubungi Customer Service
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Jika masalah berlanjut, hubungi tim support kami untuk
                    bantuan lebih lanjut.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Button
                onClick={handleTryAgain}
                className="h-12 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg"
                size="lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Coba Lagi
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                onClick={handleViewShipments}
                variant="outline"
                className="h-12 border-2 border-blue-200 hover:bg-blue-50"
                size="lg"
              >
                <FileText className="w-5 h-5 mr-2" />
                Lihat Laporan Pengiriman
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Butuh bantuan? Hubungi customer service kami
              </p>
              <div className="flex justify-center space-x-4 text-sm">
                <span className="text-blue-600">📞 (021) 1234-5678</span>
                <span className="text-green-600">
                  💬 WhatsApp: 081234567890
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tim support tersedia 24/7 untuk membantu Anda
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Actions */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Atau, lakukan aksi alternatif
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="ghost"
                className="h-10 justify-start"
              >
                🏠 Kembali ke Dashboard
              </Button>
              <Button
                onClick={() => router.push("/dashboard/akun/rekening")}
                variant="ghost"
                className="h-10 justify-start"
              >
                💳 Kelola Rekening Bank
              </Button>
              <Button
                onClick={() => router.push("/dashboard/cek-ongkir")}
                variant="ghost"
                className="h-10 justify-start"
              >
                💰 Cek Ongkir
              </Button>
              <Button
                onClick={() =>
                  window.open("https://wa.me/6281234567890", "_blank")
                }
                variant="ghost"
                className="h-10 justify-start"
              >
                📞 Bantuan Langsung
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            © 2024 BhisaKirim. Kami berkomitmen memberikan layanan terbaik
            untuk Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat halaman pembayaran...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}

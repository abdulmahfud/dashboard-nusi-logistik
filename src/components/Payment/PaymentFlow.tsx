"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Loader2,
} from "lucide-react";
import { createPayment, getPaymentStatus } from "@/lib/apiClient";
import type { PaymentStatus } from "@/types/payment";

interface PaymentFlowProps {
  shippingData: Record<string, unknown>;
  amount: number;
  onPaymentSuccess?: (payment: PaymentStatus) => void;
  onPaymentFailed?: (error: string) => void;
  onCancel?: () => void;
}

export default function PaymentFlow({
  shippingData,
  amount,
  onPaymentSuccess,
  onPaymentFailed,
  onCancel,
}: PaymentFlowProps) {
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [checking, setChecking] = useState(false);

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

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const result = await createPayment({
        shipping_data: shippingData,
        amount: amount,
      });

      if (result.success && result.data) {
        const paymentData: PaymentStatus = {
          reference_no: result.data.reference_no,
          invoice_id: result.data.invoice_id ?? "-",
          amount: Number(result.data.amount) || 0,
          status: result.data.status as
            | "pending"
            | "paid"
            | "expired"
            | "failed",
          invoice_url: result.data.invoice_url ?? undefined,
          expired_at: result.data.expired_at ?? undefined,
          created_at: new Date().toISOString(),
        };

        setPayment(paymentData);
        toast.success("Invoice pembayaran berhasil dibuat");

        // Open payment URL in new tab
        if (result.data.invoice_url) {
          window.open(result.data.invoice_url, "_blank");
        }
      } else {
        toast.error(result.message || "Gagal membuat invoice pembayaran");
        onPaymentFailed?.(result.message || "Gagal membuat invoice pembayaran");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      toast.error("Terjadi kesalahan saat membuat pembayaran");
      onPaymentFailed?.("Terjadi kesalahan saat membuat pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPaymentStatus = useCallback(async () => {
    if (!payment) return;

    setChecking(true);
    try {
      const result = await getPaymentStatus(payment.reference_no);

      if (result.success && result.data) {
        const updatedPayment = result.data;
        setPayment(updatedPayment);

        if (updatedPayment.status === "paid") {
          toast.success("Pembayaran berhasil!");
          onPaymentSuccess?.(updatedPayment);
        } else if (updatedPayment.status === "expired") {
          toast.error("Pembayaran sudah kadaluarsa");
          onPaymentFailed?.("Pembayaran sudah kadaluarsa");
        } else if (updatedPayment.status === "failed") {
          toast.error("Pembayaran gagal");
          onPaymentFailed?.("Pembayaran gagal");
        }
      } else {
        toast.error("Gagal mengecek status pembayaran");
      }
    } catch (error) {
      console.error("Check payment status error:", error);
      toast.error("Terjadi kesalahan saat mengecek status pembayaran");
    } finally {
      setChecking(false);
    }
  }, [payment, onPaymentSuccess, onPaymentFailed]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            <Clock className="w-3 h-3 mr-1" />
            Menunggu Pembayaran
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sudah Dibayar
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Kadaluarsa
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Gagal
          </Badge>
        );
      default:
        return null;
    }
  };

  // Auto-check payment status every 10 seconds if payment is pending
  useEffect(() => {
    if (payment?.status === "pending") {
      const interval = setInterval(() => {
        handleCheckPaymentStatus();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [payment?.status, handleCheckPaymentStatus]);

  if (!payment) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Konfirmasi Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Pembayaran:</span>
              <span className="text-lg font-semibold">
                {formatCurrency(amount)}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                Setelah pembayaran berhasil, order pengiriman akan diproses
                secara otomatis.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button
              onClick={handleCreatePayment}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Membuat Invoice...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Bayar Sekarang
                </>
              )}
            </Button>

            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Batal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Status Pembayaran
          </div>
          {getStatusBadge(payment.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Reference No:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">
                  {payment.reference_no}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(payment.reference_no)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div>
              <span className="text-gray-600">Jumlah:</span>
              <p className="font-semibold">{formatCurrency(payment.amount)}</p>
            </div>

            {payment.expired_at && (
              <div className="col-span-2">
                <span className="text-gray-600">Berlaku Hingga:</span>
                <p className="font-medium text-red-600">
                  {formatDate(payment.expired_at)}
                </p>
              </div>
            )}
          </div>

          {payment.payment_method && (
            <div className="text-sm">
              <span className="text-gray-600">Metode Pembayaran:</span>
              <p className="font-medium">
                {payment.payment_channel || payment.payment_method}
              </p>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex gap-3">
          {payment.status === "pending" && (
            <>
              {payment.invoice_url && (
                <Button
                  onClick={() => window.open(payment.invoice_url, "_blank")}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka Halaman Pembayaran
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleCheckPaymentStatus}
                disabled={checking}
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Cek Status
              </Button>
            </>
          )}

          {payment.status === "paid" && (
            <div className="w-full text-center text-green-600 font-medium">
              ✅ Pembayaran berhasil! Order sedang diproses...
            </div>
          )}

          {(payment.status === "expired" || payment.status === "failed") && (
            <Button
              onClick={handleCreatePayment}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Membuat Invoice Baru...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Buat Invoice Baru
                </>
              )}
            </Button>
          )}
        </div>

        {payment.status === "pending" && (
          <div className="text-xs text-gray-500 text-center">
            Status pembayaran akan diperbarui otomatis setiap 10 detik
          </div>
        )}
      </CardContent>
    </Card>
  );
}

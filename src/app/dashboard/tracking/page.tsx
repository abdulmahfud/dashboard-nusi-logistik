"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackOrderByAwb } from "@/lib/apiClient";
import { toast } from "sonner";
import { Search, Package } from "lucide-react";
import type { StandardizedTrackingResponse } from "@/types/tracking";
import { TrackingDisplay } from "@/components/tracking/TrackingDisplay";
import { normalizeTrackingResponse } from "@/lib/trackingTransform";

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const [awbNo, setAwbNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StandardizedTrackingResponse | null>(
    null
  );

  // Auto-fill awb_no from URL parameter and trigger tracking
  useEffect(() => {
    const awbParam =
      searchParams.get("awb_no") ||
      searchParams.get("awb") ||
      searchParams.get("resi");
    if (awbParam) {
      setAwbNo(awbParam);
      // Auto-track jika ada parameter awb_no
      handleTrackingRequest(awbParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTrackingRequest = async (awbNumber: string) => {
    if (!awbNumber.trim()) {
      toast.error("Masukkan nomor resi (AWB) terlebih dahulu");
      return;
    }

    setResult(null);
    setLoading(true);

    try {
      const response = await trackOrderByAwb(awbNumber.trim());

      // Normalize response (handles both standardized and raw vendor formats)
      const normalizedResponse = normalizeTrackingResponse(
        response,
        awbNumber.trim()
      );

      if (normalizedResponse) {
        setResult(normalizedResponse);
        toast.success("Data tracking berhasil ditemukan");
      } else {
        // Try to extract from error response
        const errorResponse = (response as { response?: { data?: unknown } })?.response?.data;
        if (errorResponse) {
          const errorNormalized = normalizeTrackingResponse(
            errorResponse,
            awbNumber.trim()
          );
          if (errorNormalized) {
            setResult(errorNormalized);
            toast.success("Data tracking berhasil ditemukan");
            return;
          }
        }
        toast.error("Data tracking tidak ditemukan");
      }
    } catch (error: unknown) {
      console.error("Tracking error:", error);
      
      // Try to extract vendor response from error
      const errorResponse = (error as { response?: { data?: unknown } })?.response?.data;
      if (errorResponse) {
        const normalized = normalizeTrackingResponse(
          errorResponse,
          awbNumber.trim()
        );
        if (normalized) {
          setResult(normalized);
          toast.success("Data tracking berhasil ditemukan");
          return;
        }
      }

      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Gagal melacak paket. Silakan coba lagi.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleTrackingRequest(awbNo);
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Tracking Paket</h1>
          </div>

          {/* Form Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Lacak Paket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  placeholder="Masukkan nomor resi / AWB (contoh: 11000009393873)"
                  value={awbNo}
                  onChange={(e) => setAwbNo(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button
                  className="bg-blue-500 text-white hover:bg-blue-600"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Mencari..." : "Lacak Paket"}
                </Button>
              </form>
              <p className="text-sm text-gray-600 mt-2">
                Gunakan nomor resi (AWB) untuk melacak paket dari semua vendor
                expedisi
              </p>
            </CardContent>
          </Card>

          {/* Hasil Tracking */}
          {result && (
            <div className="space-y-6">
              {/* Tracking Display with standardized data */}
              <TrackingDisplay result={result} />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

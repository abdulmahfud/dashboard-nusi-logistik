"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { trackOrderByAwb, getLionExpeditionTracking } from "@/lib/apiClient";
import {
  lionTrackingNeedsExpeditionEnrich,
  mergeLionExpeditionIntoAdminResponse,
} from "@/lib/lionTrackingTransform";
import { toast } from "sonner";
import {
  Clock,
  Headset,
  Info,
  Loader2,
  Package,
  ScanBarcode,
  Search,
  Send,
  ShieldCheck,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import type { StandardizedTrackingResponse } from "@/types/tracking";
import { TrackingDisplay } from "@/components/tracking/TrackingDisplay";
import { normalizeTrackingResponse } from "@/lib/trackingTransform";

const INFO_ITEMS: { icon: LucideIcon; text: string }[] = [
  {
    icon: Send,
    text: "Masukkan nomor resi / AWB yang valid untuk melihat status pengiriman paket secara detail dan real-time.",
  },
  {
    icon: Store,
    text: "Mendukung semua vendor ekspedisi yang bekerja sama dengan kami.",
  },
  {
    icon: Clock,
    text: "Update status setiap 5-15 menit secara otomatis.",
  },
  {
    icon: ShieldCheck,
    text: "Informasi akurat dan terpercaya.",
  },
  {
    icon: Headset,
    text: "Segera hubungi customer service jika ada kendala.",
  },
];

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
      const awb = awbNumber.trim();
      let response: unknown = await trackOrderByAwb(awb);

      if (lionTrackingNeedsExpeditionEnrich(response, awb)) {
        try {
          const lionDetail = await getLionExpeditionTracking(awb);
          response = mergeLionExpeditionIntoAdminResponse(response, lionDetail);
        } catch (enrichError) {
          console.warn("Lion expedition tracking enrich failed:", enrichError);
        }
      }

      // Normalize response (handles both standardized and raw vendor formats)
      const normalizedResponse = normalizeTrackingResponse(response, awb);

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

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Lacak Paket" },
            ]}
            icon={Package}
            title="Tracking Paket"
            description="Lacak status paket Anda dari semua vendor ekspedisi."
          />

          {/* Form Tracking */}
          <SectionCard
            icon={Search}
            title="Lacak Paket"
            description="Masukkan nomor resi / AWB untuk melacak paket dari semua vendor ekspedisi"
          >
            <div className="flex items-center gap-6">
              <div className="min-w-0 flex-1">
                <form
                  onSubmit={handleSubmit}
                  className="flex max-w-xl flex-col gap-3 sm:flex-row"
                >
                  <div className="relative flex-1">
                    <ScanBarcode
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      placeholder="Masukkan nomor resi / AWB (contoh: 11000009393873)"
                      value={awbNo}
                      onChange={(e) => setAwbNo(e.target.value)}
                      className="h-12 rounded-lg border-slate-200 bg-white pl-10"
                      required
                    />
                  </div>
                  <Button
                    className="h-12 gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mencari...
                      </>
                    ) : (
                      "Lacak Paket"
                    )}
                  </Button>
                </form>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">Contoh:</span>
                  {["11000009393873", "JP1234567890", "EZ1234567890"].map(
                    (example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setAwbNo(example)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                      >
                        {example}
                      </button>
                    )
                  )}
                </div>
              </div>

              <Image
                src="/images/deliveries_qutl.png"
                alt=""
                width={1599}
                height={906}
                sizes="340px"
                className="pointer-events-none hidden h-auto w-[300px] shrink-0 select-none lg:block xl:w-[340px]"
              />
            </div>
          </SectionCard>

          {/* Hasil Tracking */}
          {result && <TrackingDisplay result={result} />}

          {/* Informasi */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                <Info className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">Informasi</h2>
            </div>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-5 xl:divide-x xl:divide-blue-100">
              {INFO_ITEMS.map(({ icon: Icon, text }, i) => (
                <li
                  key={text}
                  className={`flex items-center gap-3 ${i > 0 ? "xl:pl-6" : ""}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

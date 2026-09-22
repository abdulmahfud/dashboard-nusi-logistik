"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { ClipboardList, PackageSearch } from "lucide-react";
import { useEffect, useState } from "react";
import CalculationResults from "@/components/PaketReguler/CalculationResults";
import {
  clearPaketRegulerCheckout,
  loadPaketRegulerCheckout,
  type PaketRegulerCheckoutData,
} from "@/components/PaketReguler/checkout-storage";

const RingkasanPaketReguler = () => {
  const router = useRouter();
  const [checkout, setCheckout] = useState<PaketRegulerCheckoutData | null>(
    null
  );
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setCheckout(loadPaketRegulerCheckout());
    setChecked(true);
  }, []);

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
              {
                label: "Kirim Paket Reguler",
                href: "/dashboard/paket/paket-reguler",
              },
              { label: "Ringkasan" },
            ]}
            icon={ClipboardList}
            title="Pilih Ekspedisi"
            description="Pilih layanan pengiriman yang sesuai, lalu lanjutkan ke pembayaran."
          />

          <div className="mx-auto w-full max-w-3xl">
            <SectionCard icon={ClipboardList} title="Pilih Ekspedisi">
              {!checked ? null : checkout ? (
                <CalculationResults
                  isSearching={false}
                  result={checkout.result}
                  formData={checkout.formData}
                  onResetForm={clearPaketRegulerCheckout}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                    <PackageSearch
                      className="h-7 w-7 text-blue-300"
                      aria-hidden
                    />
                  </span>
                  <p className="max-w-xs text-sm text-slate-500">
                    Data pengiriman tidak ditemukan. Silakan isi ulang data
                    paket dari halaman Kirim Paket Reguler.
                  </p>
                  <Button
                    type="button"
                    className="mt-1 h-10 rounded-lg bg-blue-600 px-5 hover:bg-blue-700"
                    onClick={() => router.push("/dashboard/paket/paket-reguler")}
                  >
                    Kembali ke Kirim Paket
                  </Button>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default RingkasanPaketReguler;

"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { PageHeader } from "@/components/redesign/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Loader2,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useCallback, useState } from "react";
import RegularPackageForm from "../../../../components/PaketReguler/RegularPackageForm";
import {
  savePaketRegulerCheckout,
  type PaketRegulerCheckoutFormData,
} from "@/components/PaketReguler/checkout-storage";

const PaketReguler = () => {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState<PaketRegulerCheckoutFormData>({});

  const handleCalculationResult = useCallback(
    (result: Record<string, unknown>) => {
      setIsSearching(false);
      savePaketRegulerCheckout({ result, formData });
      router.push("/dashboard/paket/paket-reguler/ringkasan");
    },
    [formData, router]
  );

  const handleFormDataChange = useCallback(
    (data: PaketRegulerCheckoutFormData) => {
      setFormData(data);
    },
    []
  );

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
              { label: "Kirim Paket Reguler" },
            ]}
            icon={Truck}
            title="Kirim Paket Reguler"
            description="Kirim paket ke seluruh Indonesia dengan mudah dan aman."
            illustration="/images/delivery-truck.png"
            illustrationClassName="w-[140px]"
          />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-10">
            <div className="min-w-0 lg:col-span-7">
              <RegularPackageForm
                onResult={handleCalculationResult}
                setIsSearching={setIsSearching}
                onFormDataChange={handleFormDataChange}
              />
            </div>

            <div className="min-w-0 space-y-6 lg:col-span-3">
              {isSearching && (
                <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600" />
                  <p className="text-sm text-slate-600">
                    Mencari layanan pengiriman dari beberapa ekspedisi...
                  </p>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 md:p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Pengiriman dijamin aman
                  </p>
                  <p className="mt-0.5 text-sm text-blue-800">
                    Kami bekerja sama dengan ekspedisi terpercaya untuk
                    memastikan paket Anda sampai dengan aman.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                <h2 className="mb-4 text-base font-semibold text-slate-900">
                  Cara Kerja Pengiriman
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Truck className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Lengkapi data pengiriman
                      </p>
                      <p className="text-sm text-slate-500">
                        Isi data pengirim, penerima, dan detail paket di sebelah
                        kiri.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Clock3 className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Bandingkan pilihan ekspedisi
                      </p>
                      <p className="text-sm text-slate-500">
                        Setelah klik &quot;Lanjut ke Ringkasan&quot;, Anda akan
                        melihat harga dari beberapa ekspedisi sekaligus.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <PackageCheck className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Bayar & paket siap dikirim
                      </p>
                      <p className="text-sm text-slate-500">
                        Pilih ekspedisi, selesaikan pembayaran, dan paket siap
                        dijemput/diantar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default PaketReguler;

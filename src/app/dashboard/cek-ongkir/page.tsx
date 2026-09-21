"use client";

import { AppSidebar } from "@/components/app-sidebar";
import ShippingForm from "@/components/CekOngkir/ShippingForm";
import ShippingResults from "@/components/CekOngkir/ShippingResults";
import { PageHeader } from "@/components/redesign/page-header";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const CekOngkir = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [calculationResult, setCalculationResult] = useState<
    Record<string, unknown> | undefined
  >(undefined);

  // Initialize the 'framer-motion' module for animations
  useEffect(() => {
    // This is just to ensure framer-motion is properly initialized
    const container = document.getElementById("app-container");
    if (container) {
      container.classList.add("motion-safe");
    }
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

        <div
          id="app-container"
          className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6"
        >
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Cek Ongkir" },
            ]}
            title="Cek Ongkir"
            description="Bandingkan harga dan layanan pengiriman dari berbagai ekspedisi."
          />

          <ShippingForm
            onResult={(result) => {
              setCalculationResult(result);
              setIsSearching(false);
            }}
            setIsSearching={setIsSearching}
          />

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Hasil Cek Ongkir
            </h2>
            <AnimatePresence mode="wait">
              {isSearching ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-60 flex-col items-center justify-center"
                >
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                  <p className="mt-4 text-sm text-slate-500">
                    Mencari layanan pengiriman...
                  </p>
                </motion.div>
              ) : calculationResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex w-full flex-col"
                >
                  <ShippingResults
                    isSearching={isSearching}
                    result={calculationResult}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-4 py-6 text-center"
                >
                  <Image
                    src="/images/card.png"
                    alt="Empty search illustration"
                    width={240}
                    height={240}
                    className="object-contain"
                  />
                  <p className="text-sm text-slate-600">
                    Input dulu yuk data alamat paketnya..
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default CekOngkir;

"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { TextSearch } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import ZipCodeForm from "@/components/CekKodePos/ZipCodeForm";
import ZipResults from "@/components/CekKodePos/ZipResults";
import { PageHeader } from "@/components/redesign/page-header";
import TopNav from "@/components/top-nav";

type ZipCode = {
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  postalCode: string;
};

export default function CekKodePos() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedZip, setSelectedZip] = useState<ZipCode | null>(null);

  // Handle proses pencarian kode pos
  const handleSelectZip = (zip: ZipCode) => {
    setIsLoading(true);
    // Small delay to show loading animation
    setTimeout(() => {
      setSelectedZip(zip);
      setIsLoading(false);
    }, 500);
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

        {/* Konten Utama */}
        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Cek Kode Pos" },
            ]}
            icon={TextSearch}
            title="Cek Kode Pos"
            description="Cari dan temukan kode pos dengan mudah dan cepat."
          />

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            {/* Form Pencarian */}
            <ZipCodeForm onSelectZip={handleSelectZip} />

            {/* Hasil Pencarian */}
            <section className="flex min-h-[22rem] items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="mt-4 text-sm text-slate-500">
                      Mencari kode pos...
                    </p>
                  </motion.div>
                ) : selectedZip ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex w-full flex-col"
                  >
                    <ZipResults selectedZip={selectedZip} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 text-center"
                  >
                    <Image
                      src="/images/kode-pos.png"
                      alt="Ilustrasi pencarian kode pos di peta"
                      width={350}
                      height={233}
                      priority
                      className="h-auto w-[280px] select-none"
                    />
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Temukan Kode Pos
                    </h2>
                    <p className="max-w-xs text-sm text-slate-600">
                      Yuk isi form di samping untuk mendapatkan kode pos alamat
                      tujuan kamu.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

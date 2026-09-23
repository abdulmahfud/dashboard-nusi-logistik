"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, Package, ShieldCheck, Truck } from "lucide-react";
import RegularPackageForm from "../../../../components/PaketReguler/RegularPackageForm";
import CalculationResults, {
  type ServiceCategory,
} from "@/components/PaketReguler/CalculationResults";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-slate-900">
        {value}
      </span>
    </div>
  );
}

const PaketReguler = () => {
  const [formResetKey, setFormResetKey] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all");
  const [selectedShipping, setSelectedShipping] = useState<{
    name: string;
    price: string;
  } | null>(null);
  const [calculationResult, setCalculationResult] = useState<
    Record<string, unknown> | undefined
  >(undefined);
  const [formData, setFormData] = useState<{
    itemValue?: string;
    paymentMethod?: string;
    formData?: {
      receiverName: string;
      receiverPhone: string;
      province: string;
      regency: string;
      district: string;
      receiverAddress: string;
      itemContent: string;
      itemType: string;
      itemValue: string;
      itemQuantity: string;
      weight: string;
      length: string;
      width: string;
      height: string;
      notes: string;
      deliveryType: "pickup" | "dropoff";
      paymentMethod: string;
    };
    businessData?: {
      id: number;
      businessName: string;
      senderName: string;
      contact: string;
      province: string | null;
      regency: string | null;
      district: string | null;
      address: string;
    } | null;
    receiverId?: string | null;
  }>({});
  const lastPaymentMethodRef = useRef<string | undefined>(undefined);

  const handleCalculationResult = useCallback(
    (result: Record<string, unknown>) => {
      setCalculationResult(result);
      setIsSearching(false);
      setActiveCategory("all");
      setSelectedShipping(null);
    },
    []
  );

  const handleSelectedOptionChange = useCallback(
    (option: { name: string; price: string } | null) => {
      setSelectedShipping(option);
    },
    []
  );

  const handleFormDataChange = useCallback((data: typeof formData) => {
    setFormData(data);
  }, []);

  useEffect(() => {
    const currentMethod = formData.paymentMethod;
    const previousMethod = lastPaymentMethodRef.current;

    // Saat metode pembayaran berubah (COD <-> Non-COD), hasil lama harus dihapus
    // agar user melakukan submit ulang dengan parameter terbaru.
    if (
      calculationResult &&
      previousMethod &&
      currentMethod &&
      previousMethod !== currentMethod
    ) {
      setCalculationResult(undefined);
      setIsSearching(false);
    }

    lastPaymentMethodRef.current = currentMethod;
  }, [formData.paymentMethod, calculationResult]);

  const handleResetForm = useCallback(() => {
    setFormData({});
    setCalculationResult(undefined);
    setIsSearching(false);
    setActiveCategory("all");
    setSelectedShipping(null);
    setFormResetKey((k) => k + 1);
  }, []);

  const detail = formData.formData;
  const weightLabel = detail?.weight ? `${detail.weight} kg` : "-";
  const dimensionLabel =
    detail?.length && detail?.width && detail?.height
      ? `${detail.length} x ${detail.width} x ${detail.height} cm`
      : "-";
  const destinationLabel =
    [detail?.district, detail?.regency, detail?.province]
      .filter(Boolean)
      .join(", ") || "-";

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
          />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-10">
            <div className="min-w-0 lg:col-span-7">
              <RegularPackageForm
                key={formResetKey}
                onResult={handleCalculationResult}
                setIsSearching={setIsSearching}
                onFormDataChange={handleFormDataChange}
              />
            </div>

            <div className="min-w-0 space-y-6 lg:col-span-3">
              <SectionCard icon={Truck} title="Pilihan Layanan">
                <Tabs
                  value={activeCategory}
                  onValueChange={(v) =>
                    setActiveCategory(v as ServiceCategory)
                  }
                  className="mb-4"
                >
                  <TabsList className="h-11 w-full items-stretch rounded-lg bg-slate-100 p-1">
                    <TabsTrigger
                      value="all"
                      className="h-full flex-1 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      Semua Layanan
                    </TabsTrigger>
                    <TabsTrigger
                      value="reguler"
                      className="h-full flex-1 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      Reguler
                    </TabsTrigger>
                    <TabsTrigger
                      value="cargo"
                      className="h-full flex-1 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      Cargo
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <AnimatePresence mode="wait">
                  {isSearching ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center gap-3 py-10 text-center"
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="text-sm text-slate-500">
                        Mencari layanan pengiriman...
                      </p>
                    </motion.div>
                  ) : calculationResult ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <CalculationResults
                        isSearching={isSearching}
                        result={calculationResult}
                        formData={formData}
                        onResetForm={handleResetForm}
                        activeCategory={activeCategory}
                        onSelectedOptionChange={handleSelectedOptionChange}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3 py-8 text-center"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                        <Package className="h-7 w-7 text-blue-300" aria-hidden />
                      </span>
                      <p className="max-w-xs text-sm text-slate-500">
                        Lengkapi data pengirim, penerima, dan detail paket
                        untuk melihat pilihan layanan yang tersedia.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SectionCard>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                <h2 className="mb-1 text-lg font-semibold text-slate-900">
                  Ringkasan Pengiriman
                </h2>
                <div className="divide-y divide-slate-100">
                  <SummaryRow label="Berat Paket" value={weightLabel} />
                  <SummaryRow label="Dimensi (P x L x T)" value={dimensionLabel} />
                  <SummaryRow label="Tujuan" value={destinationLabel} />
                  <SummaryRow
                    label="Layanan"
                    value={selectedShipping?.name ?? "-"}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-semibold text-slate-900">
                    Total Ongkir
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {selectedShipping?.price ??
                      (calculationResult ? "Pilih layanan di atas" : "-")}
                  </span>
                </div>
              </div>

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
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default PaketReguler;

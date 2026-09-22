"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { PageHeader } from "@/components/redesign/page-header";
import { FlatRateManagement } from "@/components/FlatOngkir/FlatRateManagement";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Tags } from "lucide-react";

export default function FlatOngkirPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !hasPermission("flat-shipping-rates.view")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  if (authLoading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex min-h-[40vh] items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Memuat…</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!hasPermission("flat-shipping-rates.view")) {
    return null;
  }

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
              { label: "Flat Ongkir" },
            ]}
            icon={Tags}
            title="Flat Ongkir"
            description="Kelola program harga tetap (flat) untuk cakupan provinsi tertentu, mis. Flat Ongkir Jawa & Bali."
          />

          <FlatRateManagement />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

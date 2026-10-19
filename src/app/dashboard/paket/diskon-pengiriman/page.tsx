"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { DiscountManagement } from "@/components/DiskonPengiriman/DiscountManagement";
import { PageHeader } from "@/components/redesign/page-header";
import { BadgePercent } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DiskonPengirimanPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !hasPermission("discounts.view")) {
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

  if (!hasPermission("discounts.view")) {
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
              { label: "Diskon Pengiriman" },
            ]}
            icon={BadgePercent}
            title="Diskon Pengiriman"
            description="Kelola diskon ekspedisi untuk berbagai vendor dan layanan."
            illustration="/images/calculator.png"
            illustrationClassName="w-[120px]"
          />

          <DiscountManagement />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

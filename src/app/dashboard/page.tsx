"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SectionCardsBalance } from "@/components/section-cards-balance";
import { SectionCardsCredit } from "@/components/section-cards-credit";
import { SectionCardsCod } from "@/components/section-cards-cod";
import { SectionCardsReguler } from "@/components/section-cards-reguler";
import { SectionCardsTrouble } from "@/components/section-cards-trouble";
import { SectionCardsShipmentSummary } from "@/components/section-cards-shipment-summary";
import { DateRangeField } from "@/components/redesign/date-range-field";
import TopNav from "@/components/top-nav";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

function DashboardContent() {
  const { user, loading, hasPermission } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  if (loading) return <DashboardSkeleton />;

  if (!user)
    return (
      <div className="p-6 text-red-600 font-semibold">
        User tidak ditemukan.
      </div>
    );

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex items-center justify-between w-full">
          <SiteHeader />
          <TopNav />
        </div>
        <div className="flex flex-1 flex-col bg-blue-50/80">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 p-4 md:gap-6 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Selamat datang, {user.name} 👋
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {hasPermission("orders.view_all")
                      ? "Berikut ringkasan aktivitas pengiriman seluruh akun (admin)."
                      : "Berikut ringkasan aktivitas pengiriman akun Anda."}
                  </p>
                </div>
                <DateRangeField
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Pilih periode"
                  className="w-[240px]"
                />
              </div>

              <SectionCardsBalance />
              <SectionCardsCredit user={user} />
              <SectionCardsShipmentSummary dateRange={dateRange} />
              <SectionCardsCod dateRange={dateRange} />
              <SectionCardsReguler dateRange={dateRange} />
              <SectionCardsTrouble dateRange={dateRange} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}

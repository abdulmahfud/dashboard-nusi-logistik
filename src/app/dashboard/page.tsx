"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SectionCardsBalance } from "@/components/section-cards-balance";
import { SectionCardsCod } from "@/components/section-cards-cod";
import { SectionCardsReguler } from "@/components/section-cards-reguler";
import { SectionCardsTrouble } from "@/components/section-cards-trouble";
import TopNav from "@/components/top-nav";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { user, loading } = useAuth();

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
        <div className="flex items-center justify-between w-full px-4">
          <SiteHeader />
          <TopNav />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 md:px-6 bg-blue-100">
              <h2 className="text-3xl font-bold text-blue-900 pl-3">
                Selamat datang, {user.name}
              </h2>
              <div className="mx-2 space-y-2">
                <SectionCardsBalance />
                <SectionCardsReguler />
                <SectionCardsCod />
                <SectionCardsTrouble />
              </div>
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

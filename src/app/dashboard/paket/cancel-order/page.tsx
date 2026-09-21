"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Package, AlertTriangle } from "lucide-react";
import CancelOrderTable from "@/components/CancelOrder/CancelOrderTable";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function CancelOrderPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !hasPermission("expedition.orders.cancel")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  if (authLoading) return null;
  if (!hasPermission("expedition.orders.cancel")) return null;

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
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Beranda</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-slate-900">
                  Cancel Order
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header Section */}
          <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-5 text-white shadow-sm md:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <AlertTriangle className="h-7 w-7" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Cancel Order
                </h1>
                <p className="text-sm text-red-100">
                  Batalkan pesanan dengan status proses pengiriman yang memiliki
                  AWB number.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-red-600" aria-hidden />
                <h2 className="text-lg font-semibold text-slate-900">
                  Daftar Order yang Dapat Dibatalkan
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                Hanya menampilkan order dengan status{" "}
                <span className="font-semibold">proses_pengiriman</span> dan
                memiliki AWB number
              </p>
            </div>
            <CancelOrderTable />
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle } from "lucide-react";
import CancelOrderTable from "@/components/CancelOrder/CancelOrderTable";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
        <div className="flex flex-1 flex-col bg-blue-100">
          <div className="flex flex-col gap-4">
            {/* Header Section */}
            <div className="p-6 bg-gradient-to-r from-red-600 to-red-700 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Cancel Order</h1>
                  <p className="text-red-100">
                    Batalkan pesanan dengan status proses pengiriman yang memiliki AWB number
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-red-600" />
                      <CardTitle>Daftar Order yang Dapat Dibatalkan</CardTitle>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="text-xs">
                        Hanya menampilkan order dengan status <span className="font-semibold">proses_pengiriman</span> dan memiliki AWB number
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CancelOrderTable />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Package, AlertTriangle, Download } from "lucide-react";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { Button } from "@/components/ui/button";
import ExportCancelOrderDialog from "@/components/CancelOrder/ExportCancelOrderDialog";
import CancelOrderTable from "@/components/CancelOrder/CancelOrderTable";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CancelOrderPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);
  const canExport = hasPermission("exports.cancel-orders");

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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Cancel Order" },
            ]}
            icon={AlertTriangle}
            title="Cancel Order"
            description="Batalkan pesanan dengan status proses pengiriman yang memiliki AWB number."
            action={
              canExport ? (
                <Button
                  type="button"
                  className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  onClick={() => setExportOpen(true)}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Export
                </Button>
              ) : undefined
            }
          />

          <SectionCard
            icon={Package}
            title="Daftar Order yang Dapat Dibatalkan"
            description="Hanya menampilkan order berstatus proses_pengiriman yang memiliki AWB number."
          >
            <CancelOrderTable />
          </SectionCard>
        </div>
        {canExport && (
          <ExportCancelOrderDialog
            open={exportOpen}
            onOpenChange={setExportOpen}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

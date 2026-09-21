"use client";

import { useState } from "react";
import InputFormPengirim from "@/components/Data/InputFormPengirim";
import ListSender from "@/components/Data/ListSender";
import type { Shipper } from "@/types/dataPengirim";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/redesign/page-header";
import { Send } from "lucide-react";

const DataPengirim = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingShipper, setEditingShipper] = useState<Shipper | null>(null);

  const handleShipperCreated = () => {
    // Trigger refresh of the list when a new shipper is created
    setRefreshTrigger((prev) => prev + 1);
    // Clear editing state
    setEditingShipper(null);
  };

  const handleEditShipper = (shipper: Shipper) => {
    setEditingShipper(shipper);
  };

  const handleCancelEdit = () => {
    setEditingShipper(null);
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
        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Data Pengirim" },
            ]}
            icon={Send}
            title="Data Pengirim"
            description="Kelola alamat asal pengiriman Anda."
          />

          <div
            id="app-container"
            className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3"
          >
            <div className="flex min-w-0 flex-col">
              <InputFormPengirim
                onShipperCreated={handleShipperCreated}
                editingShipper={editingShipper}
                onCancelEdit={handleCancelEdit}
              />
            </div>
            <div className="flex min-w-0 flex-col lg:col-span-2">
              <ListSender
                refreshTrigger={refreshTrigger}
                onEditShipper={handleEditShipper}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DataPengirim;

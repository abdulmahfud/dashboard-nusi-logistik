"use client";

import { useState } from "react";
import InputFormPengirim from "@/components/Data/InputFormPengirim";
import ListSender from "@/components/Data/ListSender";
import type { Shipper } from "@/types/dataPengirim";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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
        <div className="flex flex-1 flex-col bg-blue-100">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 md:px-6">
              <main className="flex-1 container">
                <div
                  id="app-container"
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="flex flex-col">
                    <InputFormPengirim
                      onShipperCreated={handleShipperCreated}
                      editingShipper={editingShipper}
                      onCancelEdit={handleCancelEdit}
                    />
                  </div>
                  <div className="flex flex-col col-span-2">
                    <ListSender 
                      refreshTrigger={refreshTrigger}
                      onEditShipper={handleEditShipper}
                    />
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DataPengirim;

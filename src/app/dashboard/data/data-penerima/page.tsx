"use client";

import { useState } from "react";
import InputFormPenerima from "@/components/Data/InputFormPenerima";
import RecipientList from "@/components/Data/RecipientList";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/redesign/page-header";
import { UserRound } from "lucide-react";

const DataPenerima = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReceiverAdded = () => {
    // Trigger refresh of the recipient list
    setRefreshTrigger((prev) => prev + 1);
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
              { label: "Data Penerima" },
            ]}
            icon={UserRound}
            title="Data Penerima"
            description="Kelola alamat penerima pengiriman Anda."
          />

          <div
            id="app-container"
            className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3"
          >
            <div className="flex min-w-0 flex-col">
              <InputFormPenerima onReceiverAdded={handleReceiverAdded} />
            </div>
            <div className="flex min-w-0 flex-col lg:col-span-2">
              <RecipientList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DataPenerima;

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { NavAccount } from "@/components/nav-account";
import { NavData } from "@/components/nav-data";
import { NavKerjaSama } from "@/components/nav-kerja-sama";
import { NavAgen } from "@/components/nav-agen";
import { NavManagementUser } from "@/components/nav-management-user";
import { NavMain } from "@/components/nav-main";
import { NavReport } from "@/components/nav-report";
import { NavWallet } from "@/components/nav-wallet";
import { NavSecondary } from "@/components/nav-secondary";
import { NavSendPackage } from "@/components/nav-send-package";
import { NavSupportTickets } from "@/components/nav-support-tickets";
import { NavUser } from "@/components/nav-user";

import { useAuth } from "@/context/AuthContext";
import { filterSidebarByPermission } from "@/lib/sidebar-permissions";
import { sidebarData } from "@/components/sidebar-data";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { hasPermission, loading: authLoading } = useAuth();
  const pathname = usePathname();

  /** Agar item menu aktif (biasanya di bawah) langsung terlihat di area scroll sidebar */
  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const root = document.querySelector('[data-sidebar="content"]');
      const active = root?.querySelector<HTMLElement>(
        '[aria-current="page"]'
      );
      active?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  const filteredNavMain = filterSidebarByPermission(
    sidebarData.navMain,
    hasPermission,
    authLoading
  );
  const filteredSupportTickets = filterSidebarByPermission(
    sidebarData.supportTickets,
    hasPermission,
    authLoading
  );
  const filteredSendPackage = filterSidebarByPermission(
    sidebarData.sendPackage,
    hasPermission,
    authLoading
  );
  const walletItemsForSidebar = filterSidebarByPermission(
    sidebarData.wallet,
    hasPermission,
    authLoading
  );
  const filteredReport = filterSidebarByPermission(
    sidebarData.report,
    hasPermission,
    authLoading
  );
  const filteredData = filterSidebarByPermission(
    sidebarData.data,
    hasPermission,
    authLoading
  );
  const filteredAccount = filterSidebarByPermission(
    sidebarData.account,
    hasPermission,
    authLoading
  );
  const filteredKerjaSama = filterSidebarByPermission(
    sidebarData.kerjaSama,
    hasPermission,
    authLoading
  );
  const filteredAgen = filterSidebarByPermission(
    sidebarData.agen,
    hasPermission,
    authLoading
  );
  const filteredNavSecondary = filterSidebarByPermission(
    sidebarData.navSecondary,
    hasPermission,
    authLoading
  );
  const filteredManagementUser = filterSidebarByPermission(
    sidebarData.managementUser,
    hasPermission,
    authLoading
  );

  // Gaya referensi: sidebar datar (bukan kartu "inset"), apa pun variant dari halaman.
  return (
    <Sidebar collapsible="offcanvas" {...props} variant="sidebar">
      <SidebarHeader className="flex h-16 flex-row items-center px-5 py-0">
        <Link href="/dashboard" aria-label="Beranda BhisaKirim">
          <Image
            src="/images/BhisaKirim_3.png"
            alt="Logo Bisakirim"
            width={150}
            height={35}
            priority
            className="h-auto w-[150px]"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavMain.length > 0 && <NavMain items={filteredNavMain} />}
        {filteredSupportTickets.length > 0 && (
          <NavSupportTickets items={filteredSupportTickets} />
        )}
        {filteredSendPackage.length > 0 && (
          <NavSendPackage items={filteredSendPackage} />
        )}
        {walletItemsForSidebar.length > 0 && (
          <NavWallet items={walletItemsForSidebar} />
        )}
        {filteredReport.length > 0 && <NavReport items={filteredReport} />}
        {filteredData.length > 0 && <NavData items={filteredData} />}
        {filteredKerjaSama.length > 0 && (
          <NavKerjaSama items={filteredKerjaSama} />
        )}
        {filteredAgen.length > 0 && <NavAgen items={filteredAgen} />}
        {filteredAccount.length > 0 && (
          <NavAccount items={filteredAccount} />
        )}
        {filteredManagementUser.length > 0 && (
          <NavManagementUser items={filteredManagementUser} />
        )}
        {filteredNavSecondary.length > 0 && (
          <NavSecondary items={filteredNavSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

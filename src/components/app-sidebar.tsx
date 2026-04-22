"use client";

import {
  ClipboardListIcon,
  FileDown,
  FileSearch,
  FileSymlink,
  FileText,
  History,
  Globe,
  House,
  PackageSearch,
  Truck,
  User,
  Wallet,
  PackageX,
  UserRoundSearch,
  UserRoundPlus,
  UserCheck,
  UserCog,
  ShieldUser,
  Banknote,
  BadgePercent,
  ArrowDownToLine,
  Ticket,
  MessageCircle,
} from "lucide-react";
import * as React from "react";
import { usePathname } from "next/navigation";

import { NavAccount } from "@/components/nav-account";
import { NavData } from "@/components/nav-data";
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

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Image from "next/image";

const data = {
  navMain: [
    {
      title: "Beranda",
      url: "/dashboard",
      icon: House,
      permission: "orders.index",
    },    
    {
      title: "Cek Ongkir",
      url: "/dashboard/cek-ongkir",
      icon: PackageSearch,
      permission: "expedition.shipment_cost.calculate",
    },
    {
      title: "Lacak Paket",
      url: "/dashboard/tracking",
      icon: Truck,
      permission: "expedition.tracking.view",
    },
    {
      title: "Cek Kode Pos",
      url: "/dashboard/cek-kode-pos",
      icon: FileSearch,
      permission: "expedition.shipment_cost.calculate",
    },
  ],
  supportTickets: [
    {
      title: "Tiket Masuk",
      url: "/dashboard/support/tickets",
      icon: Ticket,
      matchPrefix: true,
      permission: "support.tickets.manage",
    },
    {
      title: "Tiket Bantuan",
      url: "/dashboard/support/tickets/new",
      icon: Ticket,
      exact: true,
      permission: "support.tickets.create",
    },
  ],
  wallet: [
    {
      title: "Dompet",
      url: "/dashboard/wallet",
      icon: Wallet,
      matchPrefix: true,
      permissionAny: ["wallet.topup", "wallet.withdraw"],
    },
    {
      title: "Riwayat Dompet",
      url: "/dashboard/wallet/riwayat",
      icon: History,
      exact: true,
      permission: "wallet.view",
    },
    {
      title: "Semua Transaksi",
      url: "/dashboard/wallet/transactions/all",
      icon: Globe,
      exact: true,
      permission: "wallet.transactions.view_all",
    },
    {
      title: "Permintaan withdraw",
      url: "/dashboard/withdraws",
      icon: ArrowDownToLine,
      permission: "withdraws.update",
    },
  ],
  sendPackage: [
    {
      title: "Kirim Paket Reguler",
      url: "/dashboard/paket/paket-reguler",
      icon: Truck,
      permission: "expedition.orders.create",
    },
    {
      title: "Pembayaran Paket",
      url: "/dashboard/paket/pembayaran-paket",
      icon: Wallet,
      permission: "payments.view",
    },
    {
      title: "Cancel Order",
      url: "/dashboard/paket/cancel-order",
      icon: PackageX,
      permission: "expedition.orders.cancel",
    },
    {
      title: "Diskon Pengiriman",
      url: "/dashboard/paket/diskon-pengiriman",
      icon: BadgePercent,
      permission: "discounts.create",
    },
  ],
  navSecondary: [
    // {
    //   title: "Dapatkan Bantuan",
    //   url: "/dashboard/bantuan",
    //   icon: HelpCircleIcon,
    //   permission: "orders.index",
    // },
    {
      title: "Syarat & Ketentuan",
      url: "/dashboard/syarat-dan-ketentuan",
      icon: FileText,
      permission: "orders.index",
    },
    {
      title: "Kritik & Saran",
      url: "/dashboard/kritik-dan-saran",
      icon: MessageCircle,
      permissionAny: ["feedbacks.create", "feedbacks.index"],
    },
  ],
  report: [
    {
      title: "Laporan Mutasi Saldo",
      url: "/dashboard/laporan/laporan-mutasi-saldo",
      icon: ClipboardListIcon,
      permission: "wallet.view",
    },
    {
      title: "Semua Mutasi",
      url: "/dashboard/laporan/laporan-semua-mutasi",
      icon: History,
      permission: "payments.view_all",
    },
    {
      title: "Laporan Pengiriman",
      url: "/dashboard/laporan/laporan-pengiriman",
      icon: FileText,
      permission: "expedition.orders.list",
    },
  ],
  account: [
    {
      title: "Profil",
      url: "/dashboard/akun/profil",
      icon: User,
      permission: "users.index",
    },
    {
      title: "Rekening",
      url: "/dashboard/akun/rekening",
      icon: Wallet,
      permission: "bank-accounts.index",
    },
  ],
  data: [
    {
      title: "Data Pengirim",
      url: "/dashboard/data/data-pengirim",
      icon: FileSymlink,
      permission: "shipper.index",
    },
    {
      title: "Data Penerima",
      url: "/dashboard/data/data-penerima",
      icon: FileDown,
      permission: "receiver.index",
    },
  ],
  managementUser: [
    {
      title: "Pengaturan ekspedisi",
      url: "/dashboard/expedition/vendor-settings",
      icon: Truck,
      permission: "expedition.settings.update",
    },
    {
      title: "Semua Rekening Bank",
      url: "/dashboard/list-bank-accounts",
      icon: Banknote,
      permission: "bank-accounts.view_all",
    },
    {
      title: "List User",
      url: "/dashboard/users",
      icon: UserRoundSearch,
      permission: "users.store",
    },
    {
      title: "Tambah User",
      url: "/dashboard/users/create",
      icon: UserRoundPlus,
      permission: "users.store",
    },
    {
      title: "List Role",
      url: "/dashboard/roles",
      icon: UserCheck,
      permission: "roles.index",
    },
    {
      title: "Tambah Role",
      url: "/dashboard/roles/create",
      icon: UserCog,
      permission: "roles.store",
    },
    {
      title: "List Permission",
      url: "/dashboard/permissions",
      icon: ShieldUser,
      permission: "permissions.index",
    },
  ],
};

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
    data.navMain,
    hasPermission,
    authLoading
  );
  const filteredSupportTickets = filterSidebarByPermission(
    data.supportTickets,
    hasPermission,
    authLoading
  );
  const filteredSendPackage = filterSidebarByPermission(
    data.sendPackage,
    hasPermission,
    authLoading
  );
  const walletItemsForSidebar = filterSidebarByPermission(
    data.wallet,
    hasPermission,
    authLoading
  );
  const filteredReport = filterSidebarByPermission(
    data.report,
    hasPermission,
    authLoading
  );
  const filteredData = filterSidebarByPermission(
    data.data,
    hasPermission,
    authLoading
  );
  const filteredAccount = filterSidebarByPermission(
    data.account,
    hasPermission,
    authLoading
  );
  const filteredNavSecondary = filterSidebarByPermission(
    data.navSecondary,
    hasPermission,
    authLoading
  );
  const filteredManagementUser = filterSidebarByPermission(
    data.managementUser,
    hasPermission,
    authLoading
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="pt-0 pb-0 mb-5 mt-5">
        <Image
          src="/images/BhisaKirim_3.png"
          alt="Logo Bisakirim"
          width={150}
          height={150}
        />
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

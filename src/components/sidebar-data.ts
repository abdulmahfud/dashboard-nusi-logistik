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
  Handshake,
  ReceiptText,
  Boxes,
  Tag,
  Store,
  Activity,
  CreditCard,
} from "lucide-react";

/**
 * Sumber tunggal item menu sidebar (urutan & nama = tampilan sidebar).
 * Dipakai oleh AppSidebar dan pencarian global di top bar.
 */
export const sidebarData = {
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
      url: "/dashboard/support/tiket-bantuan",
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
    {
      title: "Riwayat Kredit",
      url: "/dashboard/akun/riwayat-kredit",
      icon: CreditCard,
      permission: "users.index",
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
      title: "Katalog Produk",
      url: "/dashboard/paket/katalog-produk",
      icon: Boxes,
      permission: "products.index",
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
    {
      title: "Flat Ongkir",
      url: "/dashboard/paket/flat-ongkir",
      icon: Tag,
      permission: "flat-shipping-rates.view",
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
    {
      title: "Aktivitas Pengiriman",
      url: "/dashboard/laporan/laporan-aktivitas-pengiriman",
      icon: Activity,
      permission: "reports.shipping.view",
    },
    {
      title: "Ringkasan Pengiriman",
      url: "/dashboard/akun/laporan-pengiriman",
      icon: Activity,
      permission: "users.index",
    },
  ],
  kerjaSama: [
    {
      title: "Akun Kerja Sama",
      url: "/dashboard/kerja-sama/akun",
      icon: Handshake,
      matchPrefix: true,
      permission: "kerja-sama.accounts.view",
    },
    {
      title: "Invoice Kerja Sama",
      url: "/dashboard/kerja-sama/invoices",
      icon: ReceiptText,
      matchPrefix: true,
      permission: "kerja-sama.invoices.view",
    },
  ],
  agen: [
    {
      title: "Akun Agen",
      url: "/dashboard/agen/akun",
      icon: Store,
      matchPrefix: true,
      permission: "agen-accounts.view",
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

export type SidebarNavGroupKey = keyof typeof sidebarData;

/** Urutan grup seperti dirender di sidebar, beserta labelnya. */
export const sidebarGroupOrder: { key: SidebarNavGroupKey; label: string }[] = [
  { key: "navMain", label: "Menu Utama" },
  { key: "supportTickets", label: "Bantuan" },
  { key: "sendPackage", label: "Paket" },
  { key: "wallet", label: "Saldo" },
  { key: "report", label: "Laporan" },
  { key: "data", label: "Data Alamat" },
  { key: "kerjaSama", label: "Kerja Sama" },
  { key: "agen", label: "Agen" },
  { key: "account", label: "Data Akun" },
  { key: "managementUser", label: "Management" },
  { key: "navSecondary", label: "Lainnya" },
];

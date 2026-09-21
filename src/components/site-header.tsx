"use client";

import { AlignLeft } from "lucide-react";

import { GlobalSearch } from "@/components/global-search";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Bagian kiri top bar: tombol sidebar + pencarian. Dipasangkan dengan <TopNav />
 * (kanan: Kirim Paket + menu akun). Keduanya menempel jadi satu bar putih;
 * wrapper-nya dibuat sticky lewat aturan `data-app-topbar` di globals.css.
 */
export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header
      data-app-topbar
      className="flex h-16 min-w-0 flex-1 items-center gap-3 border-b border-slate-200 bg-white pl-4 pr-2 lg:pl-6"
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
        aria-label="Buka/tutup sidebar"
      >
        <AlignLeft className="h-5 w-5" aria-hidden />
      </button>
      <GlobalSearch />
    </header>
  );
}

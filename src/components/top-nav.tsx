"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NavUserTop } from "./nav-user-top";

/** Bagian kanan top bar: tombol Kirim Paket + menu akun. */
export default function TopNav() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white pl-2 pr-4 md:gap-4 md:pr-6">
      <Button
        asChild
        className="h-11 gap-2 rounded-xl bg-blue-600 px-3 font-semibold text-white shadow-sm hover:bg-blue-700 md:px-5"
      >
        <Link href="/dashboard/paket/paket-reguler" aria-label="Kirim Paket">
          <Plus className="h-5 w-5" aria-hidden />
          <span className="hidden sm:inline">Kirim Paket</span>
        </Link>
      </Button>
      <NavUserTop />
    </div>
  );
}

import { cn } from "@/lib/utils";

/** Gaya item menu sidebar (referensi: docs/redesain/dashboard). */
export function sidebarLinkClass(isActive: boolean) {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    "[&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:shrink-0",
    isActive
      ? "bg-blue-100/70 text-blue-600"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  );
}

/** Label grup: kapital kecil abu-abu. Teks label tidak diubah, hanya tampilan. */
export const SIDEBAR_LABEL_CLASS =
  "h-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400";

import { ArrowDownToLine, ArrowUpFromLine, CircleDot } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatRupiah } from "@/lib/currency";
import { cn } from "@/lib/utils";

export type TxTone = "in" | "out" | "neutral";

type TxTypeMeta = { icon: LucideIcon; tone: TxTone };

const TYPE_META: Record<string, TxTypeMeta> = {
  topup: { icon: ArrowDownToLine, tone: "in" },
  cod_income: { icon: ArrowDownToLine, tone: "in" },
  payment: { icon: ArrowUpFromLine, tone: "out" },
  withdraw: { icon: ArrowUpFromLine, tone: "out" },
};

export function getTxTypeMeta(type: unknown): TxTypeMeta {
  const key = typeof type === "string" ? type.trim().toLowerCase() : "";
  return TYPE_META[key] ?? { icon: CircleDot, tone: "neutral" };
}

const ICON_CIRCLE_CLASS: Record<TxTone, string> = {
  in: "bg-emerald-50 text-emerald-600",
  out: "bg-rose-50 text-rose-600",
  neutral: "bg-slate-100 text-slate-500",
};

export const TX_AMOUNT_CLASS: Record<TxTone, string> = {
  in: "text-emerald-600",
  out: "text-rose-600",
  neutral: "text-slate-900",
};

export function TxIconCircle({ type }: { type: unknown }) {
  const { icon: Icon, tone } = getTxTypeMeta(type);
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        ICON_CIRCLE_CLASS[tone]
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

/** "+Rp 10.000" untuk uang masuk, "-Rp 10.000" untuk uang keluar. */
export function formatSignedRupiah(
  amount: number | string | null | undefined,
  tone: TxTone
): string {
  const abs = formatRupiah(amount).replace(/^-/, "");
  if (tone === "in") return `+${abs}`;
  if (tone === "out") return `-${abs}`;
  return abs;
}

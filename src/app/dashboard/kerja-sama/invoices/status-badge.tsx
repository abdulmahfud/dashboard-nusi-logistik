import { cn } from "@/lib/utils";
import {
  KERJA_SAMA_INVOICE_STATUS_LABEL,
  type KerjaSamaInvoiceStatus,
} from "@/types/kerjaSama";

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  partially_paid: "bg-amber-50 text-amber-700",
  overdue: "bg-rose-50 text-rose-700",
  issued: "bg-blue-50 text-blue-700",
  void: "bg-slate-100 text-slate-600",
  draft: "bg-slate-100 text-slate-600",
};

export function InvoiceStatusBadge({
  status,
}: {
  status: KerjaSamaInvoiceStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_TONE[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      {KERJA_SAMA_INVOICE_STATUS_LABEL[status] ?? status}
    </span>
  );
}

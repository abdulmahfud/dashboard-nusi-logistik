import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Ticket,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  resolveSupportTicketStatusKind,
  supportTicketPriorityBadgeClassName,
  supportTicketPriorityLabel,
} from "@/lib/supportTicketUi";
import { cn } from "@/lib/utils";
import type { SupportTicketSummary } from "@/types/supportTicket";

export type SupportStatusKind = ReturnType<
  typeof resolveSupportTicketStatusKind
>;

/** Gaya redesain per status tiket: ikon + warna tile + warna pil (pill border+bg+text). */
export const SUPPORT_STATUS_STYLE: Record<
  SupportStatusKind,
  { icon: LucideIcon; tile: string; pill: string }
> = {
  awaiting_support: {
    icon: Clock,
    tile: "bg-orange-50 text-orange-500",
    pill: "border-amber-100 bg-amber-50 text-amber-700",
  },
  awaiting_customer: {
    icon: MessageCircle,
    tile: "bg-sky-50 text-sky-600",
    pill: "border-sky-100 bg-sky-50 text-sky-700",
  },
  resolved: {
    icon: CheckCircle2,
    tile: "bg-emerald-50 text-emerald-600",
    pill: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  closed: {
    icon: XCircle,
    tile: "bg-slate-100 text-slate-500",
    pill: "border-slate-200 bg-slate-100 text-slate-600",
  },
  unknown: {
    icon: Ticket,
    tile: "bg-slate-100 text-slate-500",
    pill: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

function kindOf(ticket: SupportTicketSummary): SupportStatusKind {
  return resolveSupportTicketStatusKind(
    String(ticket.status),
    ticket.status_label
  );
}

export function TicketStatusPill({
  ticket,
  className,
}: {
  ticket: SupportTicketSummary;
  className?: string;
}) {
  const { icon: Icon, pill } = SUPPORT_STATUS_STYLE[kindOf(ticket)];
  return (
    <span
      role="status"
      className={cn(
        "inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold leading-tight",
        pill,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{ticket.status_label ?? ticket.status}</span>
    </span>
  );
}

/** Badge skala prioritas (1 tertinggi — 5 terendah). Lihat docs/be-fe/update-prioritas-tiket-bantuan.md */
export function TicketPriorityPill({
  ticket,
  className,
}: {
  ticket: SupportTicketSummary;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-tight",
        supportTicketPriorityBadgeClassName(ticket.priority),
        className
      )}
    >
      {supportTicketPriorityLabel(ticket.priority, ticket.priority_label)}
    </span>
  );
}

export function TicketStatusIcon({ ticket }: { ticket: SupportTicketSummary }) {
  const { icon: Icon, tile } = SUPPORT_STATUS_STYLE[kindOf(ticket)];
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        tile
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

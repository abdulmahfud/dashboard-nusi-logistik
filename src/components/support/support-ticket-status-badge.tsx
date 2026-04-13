import type { ReactNode } from "react";

import { supportTicketStatusBadgeClassName } from "@/lib/supportTicketUi";
import { cn } from "@/lib/utils";

type Props = {
  /** Kode status dari API (mis. awaiting_support) */
  status: string;
  /** Label Indonesia dari API — dipakai jika kode tidak dikenali */
  statusLabel?: string | null;
  children: ReactNode;
  className?: string;
};

export function SupportTicketStatusBadge({
  status,
  statusLabel,
  children,
  className,
}: Props) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex max-w-[min(100%,14rem)] items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold leading-tight transition-colors",
        supportTicketStatusBadgeClassName(status, statusLabel),
        className
      )}
    >
      {children}
    </span>
  );
}

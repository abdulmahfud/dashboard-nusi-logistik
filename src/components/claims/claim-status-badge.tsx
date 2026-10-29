import { cn } from "@/lib/utils";
import {
  claimStatusBadgeClassName,
  claimStatusIcon,
  claimStatusLabel,
} from "@/lib/packageClaimUi";

type Props = {
  status: string;
  statusLabel?: string | null;
  className?: string;
};

/** Pill badge status klaim: ikon + label, latar lembut senada warna status. */
export function ClaimStatusBadge({ status, statusLabel, className }: Props) {
  const Icon = claimStatusIcon(status);
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold leading-tight",
        claimStatusBadgeClassName(status),
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {claimStatusLabel(status, statusLabel)}
    </span>
  );
}

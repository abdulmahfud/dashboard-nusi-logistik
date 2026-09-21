import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionCardProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Slot aksi di kanan header (mis. tombol). */
  action?: React.ReactNode;
  /** Kelas tile ikon; default biru muda. */
  iconClassName?: string;
  className?: string;
  children: React.ReactNode;
};

export function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  iconClassName,
  className,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-100 bg-white shadow-sm",
        className
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4 md:p-6 md:pb-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600",
              iconClassName
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold leading-tight text-slate-900">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="px-5 pb-5 md:px-6 md:pb-6">{children}</div>
    </section>
  );
}

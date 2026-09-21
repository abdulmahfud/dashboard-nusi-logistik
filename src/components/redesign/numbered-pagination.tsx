"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_PER_PAGE_OPTIONS = [10, 20, 30, 40, 50];

function buildPages(page: number, last: number): (number | "…")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const set = new Set<number>([1, last, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= last - 2) [last - 3, last - 2, last - 1].forEach((n) => set.add(n));

  const sorted = [...set]
    .filter((n) => n >= 1 && n <= last)
    .sort((a, b) => a - b);

  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

type NumberedPaginationProps = {
  page: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
  disabled?: boolean;
  className?: string;
};

const navBtn =
  "h-9 w-9 rounded-lg border-slate-200 p-0 text-slate-600 hover:bg-slate-50";

export function NumberedPagination({
  page,
  lastPage,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  disabled = false,
  className,
}: NumberedPaginationProps) {
  const last = Math.max(lastPage, 1);
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const atFirst = page <= 1 || disabled;
  const atLast = page >= last || disabled;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Rows per page</span>
        <Select
          value={String(perPage)}
          onValueChange={(v) => onPerPageChange(Number(v))}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-[76px] rounded-lg border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {perPageOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <span className="text-sm tabular-nums text-slate-500">
          {from}–{to} dari {total}
        </span>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            className={navBtn}
            disabled={atFirst}
            onClick={() => onPageChange(1)}
          >
            <span className="sr-only">Halaman pertama</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className={navBtn}
            disabled={atFirst}
            onClick={() => onPageChange(page - 1)}
          >
            <span className="sr-only">Halaman sebelumnya</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {buildPages(page, last).map((p, i) =>
            p === "…" ? (
              <span
                key={`gap-${i}`}
                className="flex h-9 w-9 items-center justify-center text-sm text-slate-400"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                type="button"
                variant="outline"
                disabled={disabled}
                aria-current={p === page ? "page" : undefined}
                onClick={() => p !== page && onPageChange(p)}
                className={cn(
                  "h-9 min-w-9 rounded-lg px-2 text-sm tabular-nums",
                  p === page
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                {p}
              </Button>
            )
          )}

          <Button
            type="button"
            variant="outline"
            className={navBtn}
            disabled={atLast}
            onClick={() => onPageChange(page + 1)}
          >
            <span className="sr-only">Halaman berikutnya</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className={navBtn}
            disabled={atLast}
            onClick={() => onPageChange(last)}
          >
            <span className="sr-only">Halaman terakhir</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

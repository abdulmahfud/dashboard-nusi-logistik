"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateRangeFieldProps = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
};

/** "YYYY-MM-DD" dari tanggal lokal (dipakai sebagai query `date_from` / `date_to`). */
export function toApiDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

const shortDate = (d: Date) => format(d, "d MMM yyyy", { locale: idLocale });

/** Pemilih rentang tanggal "dari A sampai B" dengan gaya field redesain. */
export function DateRangeField({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
}: DateRangeFieldProps) {
  const label = value?.from
    ? value.to && value.to.getTime() !== value.from.getTime()
      ? `${shortDate(value.from)} – ${shortDate(value.to)}`
      : shortDate(value.from)
    : placeholder;

  return (
    <div className={cn("relative", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-11 w-full justify-start gap-2 rounded-lg border-slate-200 bg-white px-3 text-left font-normal",
              value?.from ? "pr-9 text-slate-900" : "text-slate-400"
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            locale={idLocale}
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>
      {value?.from && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Hapus tanggal"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DateRangeField,
  toApiDate,
} from "@/components/redesign/date-range-field";
import { createExport } from "@/lib/apiClient";
import { AxiosError } from "axios";
import { Download, Loader2 } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { VENDOR_OPTIONS } from "./vendorOptions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nilai awal mengikuti filter yang sedang diterapkan di halaman. */
  initialVendor?: string;
  initialDateFrom?: string;
  initialDateTo?: string;
}

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";

function parseApiDate(value: string | undefined): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Export "Order Belum Diproses" (tipe BE: pending-orders). */
export default function ExportPendingOrdersDialog({
  open,
  onOpenChange,
  initialVendor,
  initialDateFrom,
  initialDateTo,
}: Props) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [vendor, setVendor] = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const from = parseApiDate(initialDateFrom);
    setRange(
      from ? { from, to: parseApiDate(initialDateTo) ?? from } : undefined
    );
    setVendor(initialVendor && initialVendor !== "" ? initialVendor : "all");
  }, [open, initialVendor, initialDateFrom, initialDateTo]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await createExport({
        type: "pending-orders",
        vendor: vendor !== "all" ? vendor : undefined,
        start_date: range?.from ? toApiDate(range.from) : undefined,
        end_date: range?.to
          ? toApiDate(range.to)
          : range?.from
            ? toApiDate(range.from)
            : undefined,
      });
      toast.success("Export sedang diproses.", {
        description: "Unduh filenya di halaman Download Report.",
      });
      onOpenChange(false);
      router.push("/dashboard/download-report");
    } catch (err) {
      const data =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string } | undefined)
          : undefined;
      toast.error(data?.message || "Gagal membuat export.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-100 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Download className="h-5 w-5" aria-hidden />
            </span>
            <div className="text-left">
              <DialogTitle>Export Order Belum Diproses</DialogTitle>
              <DialogDescription>
                Daftar order yang masih menunggu pembayaran/diproses.
                Kosongkan filter untuk semua data.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Ekspedisi
          </Label>
          <Select value={vendor} onValueChange={setVendor}>
            <SelectTrigger className={fieldCls}>
              <SelectValue placeholder="Semua ekspedisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Ekspedisi</SelectItem>
              {VENDOR_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Tanggal dibuat
          </Label>
          <DateRangeField
            value={range}
            onChange={setRange}
            placeholder="Semua waktu"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg border-slate-200"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Batal
          </Button>
          <Button
            type="button"
            className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
            onClick={() => void handleExport()}
            disabled={exporting}
          >
            {exporting && <Loader2 className="h-4 w-4 animate-spin" />}
            Buat Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

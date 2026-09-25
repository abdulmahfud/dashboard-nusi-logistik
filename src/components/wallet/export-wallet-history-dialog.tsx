"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { Download, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nilai awal mengikuti filter yang sedang diterapkan di halaman. */
  initialType?: string;
  initialSearch?: string;
  /** Format YYYY-MM-DD, seperti filter halaman. */
  initialDateFrom?: string;
  initialDateTo?: string;
}

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";

const TYPE_OPTIONS = [
  { value: "topup", label: "Top Up Saldo" },
  { value: "payment", label: "Pembayaran Order" },
  { value: "withdraw", label: "Penarikan Dana (Withdraw)" },
  { value: "cod_income", label: "Pendapatan COD" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Menunggu" },
  { value: "success", label: "Berhasil" },
  { value: "failed", label: "Gagal" },
];

/** "2026-09-25" -> Date lokal (tanpa geser zona waktu). */
function parseApiDate(value: string | undefined): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Export Riwayat Dompet, data akun sendiri (docs/be-fe/export-riwayat-dompet.md). */
export default function ExportWalletHistoryDialog({
  open,
  onOpenChange,
  initialType,
  initialSearch = "",
  initialDateFrom,
  initialDateTo,
}: Props) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [transactionType, setTransactionType] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Isi awal dari filter halaman setiap dialog dibuka.
  useEffect(() => {
    if (!open) return;
    const from = parseApiDate(initialDateFrom);
    setRange(
      from ? { from, to: parseApiDate(initialDateTo) ?? from } : undefined
    );
    setTransactionType(initialType || "all");
    setStatus("all");
    setSearch(initialSearch);
  }, [open, initialType, initialSearch, initialDateFrom, initialDateTo]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await createExport({
        type: "wallet-history",
        transaction_type:
          transactionType !== "all" ? transactionType : undefined,
        status: status !== "all" ? status : undefined,
        search: search.trim() || undefined,
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
          ? (err.response?.data as
              | { message?: string; errors?: Record<string, string[]> }
              | undefined)
          : undefined;
      const first = data?.errors ? Object.values(data.errors).flat()[0] : null;
      toast.error(first || data?.message || "Gagal membuat export.");
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
              <DialogTitle>Export Riwayat Dompet</DialogTitle>
              <DialogDescription>
                Berisi transaksi dompet akun Anda sendiri. Kosongkan filter
                untuk seluruh riwayat.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Jenis transaksi
            </Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className={fieldCls}>
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className={fieldCls}>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Tanggal transaksi
          </Label>
          <DateRangeField
            value={range}
            onChange={setRange}
            placeholder="Semua waktu"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="export-wallet-search"
            className="text-sm font-medium text-slate-700"
          >
            Pencarian (opsional)
          </Label>
          <Input
            id="export-wallet-search"
            value={search}
            maxLength={255}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keterangan atau nomor referensi"
            className={fieldCls}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            File berisi data keuangan. Jangan dibagikan tanpa pengamanan. File
            dibuat di latar belakang dan bisa diunduh di halaman Download
            Report.
          </p>
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

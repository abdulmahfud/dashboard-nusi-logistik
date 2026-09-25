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
  DateRangeField,
  toApiDate,
} from "@/components/redesign/date-range-field";
import { createExport, getUsers } from "@/lib/apiClient";
import type { User } from "@/types/users";
import { AxiosError } from "axios";
import { Download, Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Export Cancel Order (docs/be-fe/export-cancel-order.md). Tanggal = tanggal cancel. */
export default function ExportCancelOrderDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [exporting, setExporting] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [account, setAccount] = useState<User | null>(null);

  // Reset isian setiap dialog dibuka.
  useEffect(() => {
    if (!open) return;
    setRange(undefined);
    setAccount(null);
    setQuery("");
    setResults([]);
  }, [open]);

  useEffect(() => {
    if (!open || account) return;
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      getUsers({ search: q, per_page: 8 })
        .then((res) => setResults(res.data.data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query, account, open]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await createExport({
        type: "cancel-orders",
        start_date: range?.from ? toApiDate(range.from) : undefined,
        end_date: range?.to
          ? toApiDate(range.to)
          : range?.from
            ? toApiDate(range.from)
            : undefined,
        user_id: account?.id,
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
      <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Download className="h-5 w-5" aria-hidden />
            </span>
            <div className="text-left">
              <DialogTitle>Export Cancel Order</DialogTitle>
              <DialogDescription>
                Pilih rentang tanggal cancel (bukan tanggal order). Kosongkan
                untuk semua waktu.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DateRangeField
          value={range}
          onChange={setRange}
          placeholder="Semua waktu"
        />

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Akun (opsional)
          </Label>
          {account ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="truncate">
                {account.name} ({account.email})
              </span>
              <button
                type="button"
                aria-label="Hapus pilihan akun"
                className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200"
                onClick={() => {
                  setAccount(null);
                  setQuery("");
                }}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Input
                placeholder="Cari nama/email (min. 3 huruf), kosong = semua akun"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                className="h-11 rounded-lg border-slate-200 bg-white pr-9"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </div>
              {results.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {results.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      className="block w-full border-b border-slate-100 p-3 text-left last:border-b-0 hover:bg-blue-50"
                      onClick={() => {
                        setAccount(u);
                        setResults([]);
                      }}
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {u.name}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Berisi semua order berstatus Dibatalkan. File dibuat di latar
          belakang, lalu bisa diunduh di halaman Download Report.
        </p>

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

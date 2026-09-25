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
import { createExport, getKerjaSamaAccounts } from "@/lib/apiClient";
import {
  KERJA_SAMA_LEDGER_STATUS_LABEL,
  KERJA_SAMA_LEDGER_TYPE_LABEL,
  type KerjaSamaAccount,
} from "@/types/kerjaSama";
import { AxiosError } from "axios";
import { Download, Loader2, Search, ShieldAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Punya `kerja-sama.accounts.view`: boleh memilih akun. Customer tidak boleh mengirim user_id. */
  canPickAccount: boolean;
  /** Nilai awal mengikuti filter halaman ("all" = semua). */
  initialType?: string;
  initialStatus?: string;
}

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";

/** Export Riwayat Kredit (docs/be-fe/export-riwayat-kredit.md). Tanggal = tanggal transaksi. */
export default function ExportLedgerDialog({
  open,
  onOpenChange,
  canPickAccount,
  initialType = "all",
  initialStatus = "all",
}: Props) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [transactionType, setTransactionType] = useState("all");
  const [status, setStatus] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KerjaSamaAccount[]>([]);
  const [searching, setSearching] = useState(false);
  const [account, setAccount] = useState<KerjaSamaAccount | null>(null);

  // Reset isian setiap dialog dibuka.
  useEffect(() => {
    if (!open) return;
    setRange(undefined);
    setTransactionType(initialType);
    setStatus(initialStatus);
    setAccount(null);
    setQuery("");
    setResults([]);
  }, [open, initialType, initialStatus]);

  useEffect(() => {
    if (!open || !canPickAccount || account) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      getKerjaSamaAccounts({ search: q, per_page: 8 })
        .then((res) => setResults(res.data.data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query, account, open, canPickAccount]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await createExport({
        type: "kerja-sama-ledger",
        transaction_type:
          transactionType !== "all" ? transactionType : undefined,
        status: status !== "all" ? status : undefined,
        start_date: range?.from ? toApiDate(range.from) : undefined,
        end_date: range?.to
          ? toApiDate(range.to)
          : range?.from
            ? toApiDate(range.from)
            : undefined,
        // Customer tidak boleh mengirim user_id (dibalas 422).
        user_id: canPickAccount && account ? account.id : undefined,
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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Download className="h-5 w-5" aria-hidden />
            </span>
            <div className="text-left">
              <DialogTitle>Export Riwayat Kredit</DialogTitle>
              <DialogDescription>
                Pilih jenis transaksi, status, dan rentang tanggal transaksi.
                Kosongkan untuk seluruh riwayat.
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
                {Object.entries(KERJA_SAMA_LEDGER_TYPE_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
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
                {Object.entries(KERJA_SAMA_LEDGER_STATUS_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
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

        {canPickAccount ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Akun (opsional)
            </Label>
            {account ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="truncate">
                  {account.company_name || account.name} ({account.email})
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
                  placeholder="Cari akun kerja sama, kosong = semua akun"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  className={`${fieldCls} pr-9`}
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
                    {results.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        className="block w-full border-b border-slate-100 p-3 text-left last:border-b-0 hover:bg-blue-50"
                        onClick={() => {
                          setAccount(a);
                          setResults([]);
                        }}
                      >
                        <p className="text-sm font-medium text-slate-900">
                          {a.company_name || a.name}
                        </p>
                        <p className="text-xs text-slate-500">{a.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Export berisi riwayat kredit akun Anda sendiri.
          </p>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            File berisi data kredit dan penagihan. Jangan dibagikan tanpa
            pengamanan. File dibuat di latar belakang dan bisa diunduh di
            halaman Download Report.
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

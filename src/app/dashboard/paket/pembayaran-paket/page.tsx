"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatCard } from "@/components/redesign/stat-card";
import { StatusBadge } from "@/components/redesign/status-badge";
import {
  DateRangeField,
  toApiDate,
} from "@/components/redesign/date-range-field";
import { AxiosError } from "axios";
import {
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Filter,
  Hash,
  Loader2,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Send,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOrdersPage,
  createPayment,
  bulkProcessOrders,
  cancelPendingOrder,
} from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah } from "@/lib/currency";
import { formatDateTimeId } from "@/lib/date";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import type { OrderStatusFilter } from "@/types/laporanPengiriman";

interface PendingOrder {
  id: number;
  reference_no: string;
  vendor: string;
  service_type_code: string;
  cod_value: number;
  item_value: number;
  status: string;
  created_at: string;
  awb_no: string;
  /** Nominal yang ditagih dari BE. `null` = data tidak tersedia (anomali); order tidak bisa dibayar. */
  payment_amount: number | null;
}

/** Filter tanggal yang sedang diterapkan (YYYY-MM-DD). */
type AppliedRange = { start?: string; end?: string };

type PageTab = "belum_diproses" | "sudah_dibayar";

function mapOrder(order: {
  id: number;
  reference_no?: string;
  vendor?: string;
  service_type_code?: string;
  cod_value?: string | number;
  item_value?: string | number;
  status?: string;
  created_at?: string;
  awb_no?: string;
  payment_amount?: number | string | null;
}): PendingOrder {
  const amount =
    order.payment_amount == null ? null : Number(order.payment_amount);
  return {
    id: order.id,
    reference_no: order.reference_no || "",
    vendor: order.vendor || "",
    service_type_code: order.service_type_code || "",
    cod_value: Number(order.cod_value) || 0,
    item_value: Number(order.item_value) || 0,
    status: order.status || "",
    created_at: order.created_at || "",
    awb_no: order.awb_no || "",
    payment_amount:
      amount !== null && Number.isFinite(amount) ? amount : null,
  };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

/** Field label kecil + ikon, dipakai berulang di body kartu order. */
function CardField({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-slate-400">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      <div className="mt-0.5 text-sm font-medium text-slate-900">
        {children}
      </div>
    </div>
  );
}

/** Kartu order untuk tab "Belum Diproses" — ganti baris tabel, 2 kolom per baris. */
function PendingOrderCard({
  order,
  isCorporate,
  selected,
  payable,
  onSelect,
  canceling,
  onCancel,
}: {
  order: PendingOrder;
  isCorporate: boolean;
  selected: boolean;
  payable: boolean;
  onSelect: (checked: boolean) => void;
  canceling: boolean;
  onCancel: () => void;
}) {
  const dt = formatDateTimeId(order.created_at);
  const isCod = order.service_type_code === "cod";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Checkbox
            className="mt-1 h-5 w-5 shrink-0 rounded-md border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            aria-label={`Pilih order ${order.id}`}
            disabled={!payable}
            checked={selected}
            onCheckedChange={(checked) => onSelect(checked === true)}
          />
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Truck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Order #{order.id}
            </p>
            <p className="break-all text-xs text-slate-500">
              Ref: {order.reference_no || "—"}
            </p>
          </div>
        </div>
        <StatusBadge
          status="pending"
          label={isCorporate ? "Belum Diproses" : "Menunggu Pembayaran"}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <CardField icon={Truck} label="Ekspedisi">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {order.vendor?.toUpperCase() || "—"}
          </span>
        </CardField>
        <CardField icon={Tag} label="Layanan">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              isCod ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
            }`}
          >
            {order.service_type_code?.toUpperCase() || "—"}
          </span>
        </CardField>
        <CardField icon={Calendar} label="Dibuat">
          {dt ? (
            <>
              {dt.date}{" "}
              <span className="tabular-nums text-slate-500">
                {dt.time.slice(0, 5)}
              </span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </CardField>
        <CardField icon={DollarSign} label="Nilai Barang">
          <span className="tabular-nums">{formatRupiah(order.item_value)}</span>
          {isCod && (
            <p className="mt-0.5 text-xs font-normal text-slate-500">
              COD: {formatRupiah(order.cod_value)}
            </p>
          )}
        </CardField>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          Biaya Kirim
        </span>
        {order.payment_amount === null ? (
          isCorporate ? (
            <span className="text-sm text-slate-400">—</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              Nominal tidak tersedia
            </span>
          )
        ) : (
          <span className="text-sm font-bold tabular-nums text-blue-600">
            {formatRupiah(order.payment_amount)}
          </span>
        )}
      </div>

      {isCorporate && (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
            disabled={canceling}
            onClick={onCancel}
          >
            {canceling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" aria-hidden />
            )}
            Batalkan
          </Button>
        </div>
      )}
    </div>
  );
}

/** Kartu order untuk tab "Sudah Dibayar" — read-only, tanpa checkbox/aksi. */
function PaidOrderCard({ order }: { order: PendingOrder }) {
  const dt = formatDateTimeId(order.created_at);
  const isCod = order.service_type_code === "cod";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <PackageCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Order #{order.id}
            </p>
            <p className="break-all text-xs text-slate-500">
              Ref: {order.reference_no || "—"}
            </p>
          </div>
        </div>
        <StatusBadge status="success" label="Sudah Dibayar" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <CardField icon={Truck} label="Ekspedisi">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {order.vendor?.toUpperCase() || "—"}
          </span>
        </CardField>
        <CardField icon={Tag} label="Layanan">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              isCod ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
            }`}
          >
            {order.service_type_code?.toUpperCase() || "—"}
          </span>
        </CardField>
        <CardField icon={Calendar} label="Dibuat">
          {dt ? (
            <>
              {dt.date}{" "}
              <span className="tabular-nums text-slate-500">
                {dt.time.slice(0, 5)}
              </span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </CardField>
        <CardField icon={DollarSign} label="Nilai Barang">
          <span className="tabular-nums">{formatRupiah(order.item_value)}</span>
          {isCod && (
            <p className="mt-0.5 text-xs font-normal text-slate-500">
              COD: {formatRupiah(order.cod_value)}
            </p>
          )}
        </CardField>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Hash className="h-3.5 w-3.5" aria-hidden />
          No. Resi
        </span>
        <span className="text-sm font-semibold text-slate-700">
          {order.awb_no || "—"}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between px-3 py-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          Biaya Kirim
        </span>
        <span className="text-sm font-bold tabular-nums text-blue-600">
          {order.payment_amount === null ? "—" : formatRupiah(order.payment_amount)}
        </span>
      </div>
    </div>
  );
}

export default function PembayaranPaketPage() {
  const { user } = useAuth();
  const isCorporate = user?.account_type === "corporate";

  // Status order yang dipakai tiap tab berbeda per tipe akun — lihat
  // docs/be-fe/review-sebelum-proses-corporate.md §0. Personal tidak pernah
  // transit di `belum_proses` (langsung ke `proses_pengiriman` setelah
  // dibayar); Corporate justru berhenti di `belum_proses` sampai di-commit.
  const pendingStatus: OrderStatusFilter = isCorporate
    ? "belum_proses"
    : "menunggu_pembayaran";
  const paidStatus: OrderStatusFilter = "proses_pengiriman";

  const [activeTab, setActiveTab] = useState<PageTab>("belum_diproses");

  // Tab "Belum Diproses"
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  /** Pilihan lintas halaman, disimpan lengkap agar total tetap benar saat ganti halaman. */
  const [selected, setSelected] = useState<Record<number, PendingOrder>>({});
  const selectedOrders = Object.values(selected);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // Tab "Sudah Dibayar" — status proses_pengiriman, daftar baca-saja.
  const [paidOrders, setPaidOrders] = useState<PendingOrder[]>([]);
  const [paidPage, setPaidPage] = useState(1);
  const [paidPerPage, setPaidPerPage] = useState(20);
  const [paidLastPage, setPaidLastPage] = useState(1);
  const [paidTotal, setPaidTotal] = useState(0);
  const [paidLoading, setPaidLoading] = useState(true);

  const [rangeInput, setRangeInput] = useState<DateRange | undefined>();
  const [appliedRange, setAppliedRange] = useState<AppliedRange>({});
  const hasFilter = Boolean(appliedRange.start || appliedRange.end);

  const fetchPendingOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Filter status dilakukan BE; tanggal hanya dikirim jika dipilih eksplisit.
      const response = await getOrdersPage({
        status: pendingStatus,
        start_date: appliedRange.start,
        end_date: appliedRange.end,
        page,
        per_page: perPage,
      });

      const list = (response.data ?? []).map(mapOrder);

      // Halaman terakhir bisa kosong setelah order diproses: mundur satu halaman.
      if (list.length === 0 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
        return;
      }

      setPendingOrders(list);
      setLastPage(response.meta?.last_page ?? 1);
      setTotal(response.meta?.total ?? list.length);
    } catch (error) {
      console.error("Failed to fetch pending orders:", error);
      toast.error("Gagal memuat data order");
    } finally {
      setLoading(false);
    }
  }, [pendingStatus, appliedRange, page, perPage]);

  const fetchPaidOrders = useCallback(async () => {
    try {
      setPaidLoading(true);
      const response = await getOrdersPage({
        status: paidStatus,
        start_date: appliedRange.start,
        end_date: appliedRange.end,
        page: paidPage,
        per_page: paidPerPage,
      });

      const list = (response.data ?? []).map(mapOrder);

      if (list.length === 0 && paidPage > 1) {
        setPaidPage((p) => Math.max(1, p - 1));
        return;
      }

      setPaidOrders(list);
      setPaidLastPage(response.meta?.last_page ?? 1);
      setPaidTotal(response.meta?.total ?? list.length);
    } catch (error) {
      console.error("Failed to fetch paid orders:", error);
      toast.error("Gagal memuat data order yang sudah diproses");
    } finally {
      setPaidLoading(false);
    }
  }, [paidStatus, appliedRange, paidPage, paidPerPage]);

  useEffect(() => {
    if (activeTab === "belum_diproses") void fetchPendingOrders();
  }, [activeTab, fetchPendingOrders]);

  useEffect(() => {
    if (activeTab === "sudah_dibayar") void fetchPaidOrders();
  }, [activeTab, fetchPaidOrders]);

  // Ganti tipe akun (jarang, tapi jaga-jaga) atau pindah tab pending:
  // reset pilihan supaya tidak menyimpan order dari status yang berbeda.
  useEffect(() => {
    setSelected({});
  }, [pendingStatus]);

  const applyFilter = () => {
    const from = rangeInput?.from;
    const to = rangeInput?.to ?? rangeInput?.from;
    setAppliedRange({
      start: from ? toApiDate(from) : undefined,
      end: to ? toApiDate(to) : undefined,
    });
    setPage(1);
    setPaidPage(1);
  };

  const resetFilter = () => {
    setRangeInput(undefined);
    setAppliedRange({});
    setPage(1);
    setPaidPage(1);
  };

  /** Personal: perlu payment_amount untuk ditagih. Corporate: selalu boleh dipilih (dicek limitnya saat commit). */
  const isPayable = (order: PendingOrder) =>
    isCorporate || order.payment_amount !== null;
  const payableOnPage = pendingOrders.filter(isPayable);

  const handleSelectOrder = (order: PendingOrder, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked && isPayable(order)) next[order.id] = order;
      else delete next[order.id];
      return next;
    });
  };

  /** "Pilih Semua" berlaku untuk order yang bisa diproses di halaman ini. */
  const handleSelectAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const order of payableOnPage) {
        if (checked) next[order.id] = order;
        else delete next[order.id];
      }
      return next;
    });
  };

  const getTotalAmount = () =>
    selectedOrders.reduce((sum, order) => sum + (order.payment_amount ?? 0), 0);

  const handleBulkPayment = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Pilih minimal 1 order untuk pembayaran");
      return;
    }

    try {
      setActionLoading(true);

      const selectedOrdersData = selectedOrders;

      const bulkShippingData = {
        vendor: "bulk_payment",
        orders: selectedOrdersData.map((order) => ({
          order_id: order.id,
          reference_no: order.reference_no,
          amount: order.payment_amount,
        })),
        detail: {
          total_orders: selectedOrdersData.length,
          total_amount: getTotalAmount(),
        },
      };

      const paymentResponse = await createPayment({
        shipping_data: bulkShippingData,
        amount: getTotalAmount(),
      });

      if (paymentResponse.success && paymentResponse.data) {
        if (paymentResponse.data.invoice_url) {
          // Xendit: buka halaman invoice
          window.open(paymentResponse.data.invoice_url, "_blank");
          toast.success("Invoice pembayaran berhasil dibuat");
        } else if (paymentResponse.data.payment_method === "wallet") {
          // Wallet: langsung lunas, tidak ada invoice eksternal
          toast.success("Pembayaran via saldo wallet berhasil.");
          setSelected({});
          void fetchPendingOrders();
        }
      } else {
        toast.error(
          paymentResponse.message || "Gagal membuat invoice pembayaran"
        );
      }
    } catch (error) {
      console.error("Bulk payment error:", error);
      toast.error("Terjadi kesalahan saat membuat pembayaran");
    } finally {
      setActionLoading(false);
    }
  };

  /** Corporate: commit batch ke ekspedisi, ongkir dibebankan ke limit kredit. */
  const handleBulkProcess = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Pilih minimal 1 order untuk diproses");
      return;
    }

    try {
      setActionLoading(true);
      // Urutan order_ids menentukan prioritas kalau limit pas-pasan — kirim
      // sesuai urutan tampil (paling lama dibuat duluan).
      const orderIds = [...selectedOrders]
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map((o) => o.id);

      const res = await bulkProcessOrders(orderIds);
      const results = res.data?.results ?? [];
      const queued = results.filter((r) => r.status === "queued").length;
      const insufficient = results.filter(
        (r) => r.status === "insufficient_credit"
      ).length;
      const notEligible = results.filter(
        (r) => r.status === "not_eligible" || r.status === "not_found"
      ).length;

      if (queued > 0) {
        toast.success(
          `${queued} order dikirim ke ekspedisi. Status akan berubah jadi "Sudah Dibayar" setelah selesai diproses (beberapa saat).`
        );
      }
      if (insufficient > 0) {
        toast.error(
          `${insufficient} order belum diproses — limit kredit tidak cukup saat ini.`
        );
      }
      if (notEligible > 0) {
        toast.error(`${notEligible} order tidak valid untuk diproses.`);
      }
      if (results.length === 0) {
        toast.error(res.message || "Gagal memproses order.");
      }

      setSelected({});
      void fetchPendingOrders();
    } catch (error) {
      toast.error(getErrorMessage(error, "Terjadi kesalahan saat memproses order."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPending = async (order: PendingOrder) => {
    setCancelingId(order.id);
    try {
      await cancelPendingOrder(order.id);
      toast.success(`Order #${order.id} dibatalkan.`);
      setSelected((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
      void fetchPendingOrders();
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal membatalkan order."));
    } finally {
      setCancelingId(null);
    }
  };

  const allSelected =
    payableOnPage.length > 0 &&
    payableOnPage.every((order) => selected[order.id]);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Pembayaran Paket" },
            ]}
            title="Pembayaran Paket"
            description={
              isCorporate
                ? "Periksa ulang paket sebelum diproses ke ekspedisi — ongkir dibebankan ke limit kredit akun kerja sama Anda."
                : "Periksa ulang paket yang sudah dibuat sebelum diproses ke ekspedisi."
            }
            action={
              <Button
                onClick={() =>
                  activeTab === "belum_diproses"
                    ? fetchPendingOrders()
                    : fetchPaidOrders()
                }
                variant="outline"
                disabled={activeTab === "belum_diproses" ? loading : paidLoading}
                className="h-10 gap-2 rounded-lg border-slate-200 bg-white"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    (activeTab === "belum_diproses" ? loading : paidLoading)
                      ? "animate-spin"
                      : ""
                  }`}
                  aria-hidden
                />
                Refresh
              </Button>
            }
          />

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as PageTab)}
          >
            <TabsList className="h-11 w-full max-w-md items-stretch rounded-lg bg-slate-100 p-1 sm:w-auto">
              <TabsTrigger
                value="belum_diproses"
                className="h-full flex-1 gap-2 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none sm:flex-none sm:px-6"
              >
                Belum Diproses
              </TabsTrigger>
              <TabsTrigger
                value="sudah_dibayar"
                className="h-full flex-1 gap-2 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none sm:flex-none sm:px-6"
              >
                Sudah Dibayar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "belum_diproses" ? (
            <>
              {/* Summary Card */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                  icon={Clock}
                  tone="orange"
                  title="Total Order Pending"
                  value={String(total)}
                  hint={
                    isCorporate
                      ? "Order menunggu diproses"
                      : "Order menunggu pembayaran"
                  }
                />
                <StatCard
                  icon={CheckCircle2}
                  tone="green"
                  title="Order Dipilih"
                  value={String(selectedOrders.length)}
                  hint={
                    isCorporate
                      ? "Order siap diproses"
                      : "Order siap untuk dibayar"
                  }
                />
                <StatCard
                  icon={CreditCard}
                  tone="blue"
                  title={isCorporate ? "Total Nilai" : "Total Pembayaran"}
                  value={formatRupiah(getTotalAmount())}
                  hint={
                    isCorporate
                      ? "Akan dibebankan ke limit kredit"
                      : "Total nominal pembayaran"
                  }
                />
              </div>

              {/* Filter tanggal */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyFilter();
                }}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <DateRangeField
                  value={rangeInput}
                  onChange={setRangeInput}
                  placeholder="Pilih rentang tanggal"
                  className="w-full sm:w-[290px]"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  <Filter className="h-4 w-4" aria-hidden />
                  Terapkan Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilter}
                  disabled={loading || (!hasFilter && !rangeInput)}
                  className="h-11 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </Button>
              </form>

              {/* Orders List */}
              <SectionCard icon={ReceiptText} title="Belum Diproses">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {isCorporate
                      ? "Order yang belum dikirim ke ekspedisi — pilih beberapa lalu proses sekaligus."
                      : "Order yang belum dibayar — pilih beberapa lalu bayar sekaligus."}
                  </p>
                  {payableOnPage.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                      />
                      <label
                        htmlFor="select-all"
                        className="cursor-pointer text-sm font-medium text-slate-700"
                      >
                        Pilih Semua
                      </label>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16 text-slate-500">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
                    <span>Memuat data order...</span>
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-12 text-center">
                    <div className="relative mb-6">
                      <span className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-50">
                        <ReceiptText
                          className="h-12 w-12 text-blue-300"
                          aria-hidden
                        />
                      </span>
                      <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-200 text-blue-700 ring-4 ring-white">
                        <DollarSign className="h-5 w-5" aria-hidden />
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      {hasFilter
                        ? "Tidak ada order pada rentang tanggal ini"
                        : isCorporate
                          ? "Tidak ada order yang menunggu diproses"
                          : "Tidak ada order yang menunggu pembayaran"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {hasFilter
                        ? "Coba ubah atau reset filter tanggal."
                        : isCorporate
                          ? "Order non-COD yang baru dibuat akan muncul di sini."
                          : "Order yang menunggu pembayaran akan muncul di sini."}
                    </p>
                    {hasFilter ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetFilter}
                        className="mt-6 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Reset Filter
                      </Button>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Link href="/dashboard">Kembali ke Beranda</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {pendingOrders.map((order) => (
                        <PendingOrderCard
                          key={order.id}
                          order={order}
                          isCorporate={isCorporate}
                          payable={isPayable(order)}
                          selected={Boolean(selected[order.id])}
                          onSelect={(checked) =>
                            handleSelectOrder(order, checked)
                          }
                          canceling={cancelingId === order.id}
                          onCancel={() => void handleCancelPending(order)}
                        />
                      ))}
                    </div>
                    <NumberedPagination
                      className="mt-2"
                      page={page}
                      lastPage={lastPage}
                      total={total}
                      perPage={perPage}
                      disabled={loading}
                      onPageChange={setPage}
                      onPerPageChange={(n) => {
                        setPerPage(n);
                        setPage(1);
                      }}
                    />
                  </div>
                )}
              </SectionCard>

              {/* Payment / Process Action */}
              {selectedOrders.length > 0 && (
                <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-blue-900/5 md:px-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {isCorporate
                        ? "Konfirmasi Proses ke Ekspedisi"
                        : "Konfirmasi Pembayaran"}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {selectedOrders.length} order dipilih - Total:{" "}
                      <span className="font-semibold text-slate-900">
                        {formatRupiah(getTotalAmount())}
                      </span>
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      void (isCorporate ? handleBulkProcess() : handleBulkPayment())
                    }
                    disabled={actionLoading}
                    className="h-11 gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isCorporate ? "Memproses..." : "Membuat Invoice..."}
                      </>
                    ) : isCorporate ? (
                      <>
                        <Send className="h-4 w-4" />
                        Proses ke Ekspedisi
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Bayar Sekarang
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Summary Card */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <StatCard
                  icon={PackageCheck}
                  tone="green"
                  title="Total Sudah Diproses"
                  value={String(paidTotal)}
                  hint="Sedang dikirim ke ekspedisi"
                />
                <StatCard
                  icon={ReceiptText}
                  tone="blue"
                  title="Total Nilai"
                  value={formatRupiah(
                    paidOrders.reduce(
                      (sum, o) => sum + (o.payment_amount ?? 0),
                      0
                    )
                  )}
                  hint="Jumlah nominal di halaman ini"
                />
              </div>

              {/* Filter tanggal */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyFilter();
                }}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <DateRangeField
                  value={rangeInput}
                  onChange={setRangeInput}
                  placeholder="Pilih rentang tanggal"
                  className="w-full sm:w-[290px]"
                />
                <Button
                  type="submit"
                  disabled={paidLoading}
                  className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  <Filter className="h-4 w-4" aria-hidden />
                  Terapkan Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilter}
                  disabled={paidLoading || (!hasFilter && !rangeInput)}
                  className="h-11 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </Button>
              </form>

              <SectionCard icon={PackageCheck} title="Sudah Dibayar">
                <p className="mb-4 text-sm text-slate-500">
                  Order yang sudah lolos tahap pembayaran/limit kredit dan
                  sedang diproses ke ekspedisi. Order yang sudah lebih lanjut
                  (mis. sampai tujuan) ada di halaman Laporan Pengiriman.
                </p>

                {paidLoading ? (
                  <div className="flex items-center justify-center py-16 text-slate-500">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
                    <span>Memuat data order...</span>
                  </div>
                ) : paidOrders.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-12 text-center">
                    <span className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50">
                      <PackageCheck
                        className="h-12 w-12 text-emerald-300"
                        aria-hidden
                      />
                    </span>
                    <p className="text-lg font-semibold text-slate-900">
                      {hasFilter
                        ? "Tidak ada order pada rentang tanggal ini"
                        : "Belum ada order yang sudah dibayar"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {hasFilter
                        ? "Coba ubah atau reset filter tanggal."
                        : "Order yang sudah dibayar akan muncul di sini."}
                    </p>
                    {hasFilter && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetFilter}
                        className="mt-6 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Reset Filter
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {paidOrders.map((order) => (
                        <PaidOrderCard key={order.id} order={order} />
                      ))}
                    </div>
                    <NumberedPagination
                      className="mt-2"
                      page={paidPage}
                      lastPage={paidLastPage}
                      total={paidTotal}
                      perPage={paidPerPage}
                      disabled={paidLoading}
                      onPageChange={setPaidPage}
                      onPerPageChange={(n) => {
                        setPaidPerPage(n);
                        setPaidPage(1);
                      }}
                    />
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

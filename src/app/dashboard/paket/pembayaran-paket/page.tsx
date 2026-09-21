"use client";

import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { StatCard } from "@/components/redesign/stat-card";
import { StatusBadge } from "@/components/redesign/status-badge";
import {
  DateRangeField,
  toApiDate,
} from "@/components/redesign/date-range-field";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Filter,
  Loader2,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOrdersPage,
  createPayment,
  getWalletBalance,
} from "@/lib/apiClient";
import { formatRupiah } from "@/lib/currency";
import { formatDateTimeId } from "@/lib/date";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DateRange } from "react-day-picker";

interface PendingOrder {
  id: number;
  reference_no: string;
  vendor: string;
  service_type_code: string;
  cod_value: number;
  item_value: number;
  status: string;
  created_at: string;
  /** Nominal yang ditagih dari BE. `null` = data tidak tersedia (anomali); order tidak bisa dibayar. */
  payment_amount: number | null;
}

const headCls = "h-11 text-xs font-semibold text-slate-500";

/** Filter tanggal yang sedang diterapkan (YYYY-MM-DD). */
type AppliedRange = { start?: string; end?: string };

export default function PembayaranPaketPage() {
  const { user } = useAuth();
  const router = useRouter();
  // Akun agen prepaid-only: cuma boleh bayar via saldo wallet, tidak pernah
  // Xendit. Lihat docs/be-fe/akun-agen.md §2 & update-deteksi-tipe-akun-me.md
  const isAgen = user?.account_type === "agen";

  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  /** Pilihan lintas halaman, disimpan lengkap agar total tetap benar saat ganti halaman. */
  const [selected, setSelected] = useState<Record<number, PendingOrder>>({});
  const selectedOrders = Object.values(selected);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  const [rangeInput, setRangeInput] = useState<DateRange | undefined>();
  const [appliedRange, setAppliedRange] = useState<AppliedRange>({});
  const hasFilter = Boolean(appliedRange.start || appliedRange.end);

  useEffect(() => {
    if (!isAgen) return;
    setWalletLoading(true);
    getWalletBalance()
      .then((res) => setWalletBalance(Number(res.data?.balance) || 0))
      .catch(() => setWalletBalance(0))
      .finally(() => setWalletLoading(false));
  }, [isAgen]);

  const fetchPendingOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Filter status dilakukan BE; tanggal hanya dikirim jika dipilih eksplisit.
      const response = await getOrdersPage({
        status: "menunggu_pembayaran",
        start_date: appliedRange.start,
        end_date: appliedRange.end,
        page,
        per_page: perPage,
      });

      const list = (response.data ?? []).map((order): PendingOrder => {
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
          payment_amount:
            amount !== null && Number.isFinite(amount) ? amount : null,
        };
      });

      // Halaman terakhir bisa kosong setelah order dibayar: mundur satu halaman.
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
  }, [appliedRange, page, perPage]);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  const applyFilter = () => {
    const from = rangeInput?.from;
    const to = rangeInput?.to ?? rangeInput?.from;
    setAppliedRange({
      start: from ? toApiDate(from) : undefined,
      end: to ? toApiDate(to) : undefined,
    });
    setPage(1);
  };

  const resetFilter = () => {
    setRangeInput(undefined);
    setAppliedRange({});
    setPage(1);
  };

  const isPayable = (order: PendingOrder) => order.payment_amount !== null;
  const payableOnPage = pendingOrders.filter(isPayable);

  const handleSelectOrder = (order: PendingOrder, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked && isPayable(order)) next[order.id] = order;
      else delete next[order.id];
      return next;
    });
  };

  /** "Pilih Semua" berlaku untuk order yang bisa dibayar di halaman ini. */
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

    if (isAgen && walletBalance < getTotalAmount()) {
      toast.error(
        "Saldo tidak cukup. Akun agen hanya bisa membayar via saldo wallet — silakan topup dulu."
      );
      return;
    }

    try {
      setPaymentLoading(true);

      const selectedOrdersData = selectedOrders;

      // For now, create a single payment for all selected orders
      // In the future, you might want to create individual payments or bulk payment
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
        payment_method: isAgen ? "wallet" : undefined,
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
      setPaymentLoading(false);
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
            description="Kelola pembayaran untuk order yang menunggu pembayaran."
            action={
              <Button
                onClick={fetchPendingOrders}
                variant="outline"
                disabled={loading}
                className="h-10 gap-2 rounded-lg border-slate-200 bg-white"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </Button>
            }
          />

          {/* Summary Card */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={Clock}
              tone="orange"
              title="Total Order Pending"
              value={String(total)}
              hint="Order menunggu pembayaran"
            />
            <StatCard
              icon={CheckCircle2}
              tone="green"
              title="Order Dipilih"
              value={String(selectedOrders.length)}
              hint="Order siap untuk dibayar"
            />
            <StatCard
              icon={CreditCard}
              tone="blue"
              title="Total Pembayaran"
              value={formatRupiah(getTotalAmount())}
              hint="Total nominal pembayaran"
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
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Order Menunggu Pembayaran
              </h2>
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
                    : "Tidak ada order yang menunggu pembayaran"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {hasFilter
                    ? "Coba ubah atau reset filter tanggal."
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className={`${headCls} w-10`}>
                        <span className="sr-only">Pilih</span>
                      </TableHead>
                      <TableHead className={headCls}>Order</TableHead>
                      <TableHead className={headCls}>Ekspedisi</TableHead>
                      <TableHead className={headCls}>Layanan</TableHead>
                      <TableHead className={headCls}>Dibuat</TableHead>
                      <TableHead className={`${headCls} text-right`}>
                        Nilai Barang
                      </TableHead>
                      <TableHead className={`${headCls} text-right`}>
                        Biaya Kirim
                      </TableHead>
                      <TableHead className={headCls}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((order) => {
                      const dt = formatDateTimeId(order.created_at);
                      const isCod = order.service_type_code === "cod";
                      return (
                        <TableRow
                          key={order.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4">
                            <Checkbox
                              className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                              aria-label={`Pilih order ${order.id}`}
                              disabled={!isPayable(order)}
                              checked={Boolean(selected[order.id])}
                              onCheckedChange={(checked) =>
                                handleSelectOrder(order, checked === true)
                              }
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              Order #{order.id}
                            </p>
                            <p className="break-all text-xs text-slate-500">
                              Ref: {order.reference_no || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {order.vendor?.toUpperCase() || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span
                              className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                isCod
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {order.service_type_code?.toUpperCase() || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm">
                            {dt ? (
                              <>
                                <p className="text-slate-900">{dt.date}</p>
                                <p className="text-xs tabular-nums text-slate-500">
                                  {dt.time.slice(0, 5)}
                                </p>
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-right text-sm tabular-nums text-slate-700">
                            {formatRupiah(order.item_value)}
                            {isCod && (
                              <p className="text-xs text-slate-500">
                                COD: {formatRupiah(order.cod_value)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-right text-sm font-bold tabular-nums text-blue-600">
                            {order.payment_amount === null ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                                <AlertTriangle
                                  className="h-3.5 w-3.5"
                                  aria-hidden
                                />
                                Nominal tidak tersedia
                              </span>
                            ) : (
                              formatRupiah(order.payment_amount)
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <StatusBadge
                              status="pending"
                              label="Menunggu Pembayaran"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
          </section>

          {/* Payment Action */}
          {selectedOrders.length > 0 && (
            <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-blue-900/5 md:px-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Konfirmasi Pembayaran
                </h3>
                <p className="text-sm text-slate-600">
                  {selectedOrders.length} order dipilih - Total:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(getTotalAmount())}
                  </span>
                </p>
                {isAgen && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <Wallet className="h-4 w-4 text-slate-400" aria-hidden />
                    Saldo wallet:{" "}
                    {walletLoading ? "Memuat..." : formatRupiah(walletBalance)}
                  </p>
                )}
              </div>
              {isAgen && !walletLoading && walletBalance < getTotalAmount() ? (
                <Button
                  onClick={() => router.push("/dashboard/wallet")}
                  className="h-11 gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
                >
                  <Wallet className="h-4 w-4" aria-hidden />
                  Topup Saldo
                </Button>
              ) : (
                <Button
                  onClick={handleBulkPayment}
                  disabled={paymentLoading || walletLoading}
                  className="h-11 gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Membuat Invoice...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Bayar Sekarang
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

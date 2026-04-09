"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ClipboardListIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getPaymentHistory } from "@/lib/apiClient";
import { AxiosError } from "axios";
import type { PaymentStatus } from "@/types/payment";

type BalanceHistory = {
  mutation: string;
  value: number;
  status: string;
  createdAt: string;
  releasedAt: string;
};

const LaporanMutasiSaldo = () => {
  const [statusFilter, setStatusFilter] = useState<string>("Semua Status");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [data, setData] = useState<BalanceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapStatusLabel = (status?: string): string => {
    const s = (status || "").toLowerCase();
    if (s === "success" || s === "paid") return "Sukses";
    if (s === "failed") return "Gagal";
    if (s === "expired") return "Gagal";
    if (s === "pending") return "Pending";
    return status || "Pending";
  };

  const mapMutation = (item: PaymentStatus): string => {
    if (item.reference_no) return `Pembayaran ${String(item.reference_no)}`;
    if (item.invoice_id) return `Invoice ${String(item.invoice_id)}`;
    return "Mutasi pembayaran";
  };

  useEffect(() => {
    const loadMutasi = async () => {
      setLoading(true);
      setError(null);
      try {
        const statusParam: string | undefined =
          statusFilter === "Semua Status"
            ? undefined
            : statusFilter === "Sukses"
              ? "paid"
              : statusFilter === "Gagal"
                ? "failed"
                : "pending";

        const res = await getPaymentHistory({
          status: statusParam,
          per_page: 100,
        });
        const rows = (res.data ?? []) as unknown as PaymentStatus[];

        setData(
          rows.map((item) => ({
            mutation: mapMutation(item),
            value: Number(item.amount ?? 0) || 0,
            status: mapStatusLabel(item.status),
            createdAt:
              typeof item.created_at === "string" ? item.created_at : "-",
            releasedAt:
              typeof item.paid_at === "string"
                ? item.paid_at
                : typeof item.expired_at === "string"
                  ? item.expired_at
                  : "-",
          }))
        );
      } catch (e) {
        if (e instanceof AxiosError) {
          const msg = (e.response?.data as { message?: string })?.message;
          setError(msg || "Gagal memuat data mutasi saldo.");
        } else {
          setError("Gagal memuat data mutasi saldo.");
        }
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    void loadMutasi();
  }, [statusFilter]);

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
        <div className="flex flex-1 flex-col bg-blue-50/80">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 md:px-6">
              <div className="flex items-center gap-2">
                <ClipboardListIcon className="h-7 w-7 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Laporan Mutasi Saldo
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Riwayat mutasi saldo dengan filter admin.
                  </p>
                </div>
              </div>
              <Card>
                <DataTable
                  columns={columns}
                  data={data}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  loading={loading}
                  error={error}
                />
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LaporanMutasiSaldo;

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Headphones,
  Loader2,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Ticket,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import {
  TicketStatusIcon,
  TicketStatusPill,
} from "@/components/support/ticket-status-ui";
import { SectionCard } from "@/components/redesign/section-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { getSupportTickets } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { normalizeSupportTicketsList } from "@/lib/supportTickets";
import {
  SUPPORT_DEPARTMENT_OPTIONS,
  SUPPORT_STATUS_OPTIONS,
  formatTicketDateTime,
} from "@/lib/supportTicketUi";
import { cn } from "@/lib/utils";
import type { SupportTicketSummary } from "@/types/supportTicket";
import Link from "next/link";

const headCls = "h-11 text-xs font-semibold text-slate-500";

type StatusCounts = {
  awaiting_support: number;
  awaiting_customer: number;
  resolved: number;
  closed: number;
  total: number;
};

const SUMMARY_CARDS: {
  /** Nilai filter status ("all" = semua tiket). */
  value: string;
  countKey: keyof StatusCounts;
  title: string;
  hint: string;
  icon: LucideIcon;
  tile: string;
}[] = [
  {
    value: "awaiting_support",
    countKey: "awaiting_support",
    title: "Menunggu Jawaban",
    hint: "Menunggu balasan tim support",
    icon: Clock,
    tile: "bg-orange-50 text-orange-500",
  },
  {
    value: "awaiting_customer",
    countKey: "awaiting_customer",
    title: "Dalam Penanganan",
    hint: "Menunggu balasan pengguna",
    icon: Headphones,
    tile: "bg-blue-50 text-blue-600",
  },
  {
    value: "resolved",
    countKey: "resolved",
    title: "Selesai",
    hint: "Tiket telah diselesaikan",
    icon: CheckCircle2,
    tile: "bg-violet-50 text-violet-600",
  },
  {
    value: "closed",
    countKey: "closed",
    title: "Ditutup",
    hint: "Tiket sudah ditutup",
    icon: XCircle,
    tile: "bg-slate-100 text-slate-500",
  },
  {
    value: "all",
    countKey: "total",
    title: "Semua Tiket",
    hint: "Total seluruh tiket",
    icon: FileText,
    tile: "bg-emerald-50 text-emerald-600",
  },
];

export default function SupportTicketsListPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canManage = hasPermission("support.tickets.manage");
  const canAccessPage = canManage;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SupportTicketSummary[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState(false);

  const load = useCallback(
    async (opts?: {
      targetPage?: number;
      status?: string;
      department?: string;
    }) => {
      if (!canAccessPage) return;
      setLoading(true);
      setError(null);
      try {
        const pageToUse = opts?.targetPage ?? page;
        const status =
          opts?.status !== undefined ? opts.status : filterStatus;
        const department =
          opts?.department !== undefined ? opts.department : filterDepartment;
        const params: Record<string, string | number> = {
          page: pageToUse,
          per_page: perPage,
        };
        if (canManage) {
          if (status !== "all") params.status = status;
          if (department !== "all") params.department = department;
        }
        const raw = await getSupportTickets(params);
        const n = normalizeSupportTicketsList(raw);
        setItems(n.items);
        setLastPage(n.lastPage);
        setTotal(n.total);
      } catch (e) {
        const msg =
          e instanceof AxiosError
            ? getAxiosErrorMessage(e, "Gagal memuat tiket.")
            : "Gagal memuat tiket.";
        setError(msg);
        setItems([]);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [canAccessPage, canManage, page, perPage, filterStatus, filterDepartment]
  );

  /**
   * Jumlah tiket per status: tiap status diminta dengan per_page=1 dan hanya
   * membaca `total`-nya. Mengikuti filter departemen yang aktif.
   */
  const loadCounts = useCallback(async () => {
    if (!canManage) return;
    setCountsLoading(true);
    try {
      const countFor = async (status?: string) => {
        const params: Record<string, string | number> = {
          page: 1,
          per_page: 1,
        };
        if (status) params.status = status;
        if (filterDepartment !== "all") params.department = filterDepartment;
        const raw = await getSupportTickets(params);
        return normalizeSupportTicketsList(raw).total;
      };
      const [awaiting_support, awaiting_customer, resolved, closed, all] =
        await Promise.all([
          countFor("awaiting_support"),
          countFor("awaiting_customer"),
          countFor("resolved"),
          countFor("closed"),
          countFor(),
        ]);
      setCounts({
        awaiting_support,
        awaiting_customer,
        resolved,
        closed,
        total: all,
      });
    } catch {
      setCounts(null);
    } finally {
      setCountsLoading(false);
    }
  }, [canManage, filterDepartment]);

  useEffect(() => {
    if (!authLoading && canAccessPage) {
      void loadCounts();
    }
  }, [authLoading, canAccessPage, loadCounts]);

  useEffect(() => {
    if (!authLoading && !canAccessPage) {
      router.replace("/dashboard");
    }
  }, [authLoading, canAccessPage, router]);

  useEffect(() => {
    if (!authLoading && canAccessPage) {
      void load();
    }
  }, [authLoading, canAccessPage, load]);

  const applyFilters = () => {
    setPage(1);
    void load({
      targetPage: 1,
      status: filterStatus,
      department: filterDepartment,
    });
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  if (authLoading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex min-h-[40vh] items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Memuat…</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!canAccessPage) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-12 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Tiket Masuk" },
            ]}
            icon={Headphones}
            title="Tiket Masuk"
            description="Kelola semua tiket yang masuk dari pengguna."
          />

          {canManage && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {SUMMARY_CARDS.map((card) => {
                const Icon = card.icon;
                const active = filterStatus === card.value;
                const count = counts?.[card.countKey];
                return (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => {
                      setFilterStatus(card.value);
                      setPage(1);
                    }}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors hover:bg-slate-50",
                      active
                        ? "border-blue-300 ring-2 ring-blue-100"
                        : "border-slate-100"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                        card.tile
                      )}
                    >
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {card.title}
                      </span>
                      <span className="block text-2xl font-bold tabular-nums text-slate-900">
                        {count !== undefined
                          ? count
                          : countsLoading
                            ? "…"
                            : "–"}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {card.hint}
                      </span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-slate-400"
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          )}

          {canManage && (
            <SectionCard
              icon={SlidersHorizontal}
              title="Filter (admin)"
              description="Saring tiket berdasarkan status dan departemen."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger
                      aria-label="Filter status"
                      className="h-11 rounded-lg border-slate-200 bg-white"
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua status</SelectItem>
                      {SUPPORT_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterDepartment}
                    onValueChange={setFilterDepartment}
                  >
                    <SelectTrigger
                      aria-label="Filter departemen"
                      className="h-11 rounded-lg border-slate-200 bg-white"
                    >
                      <SelectValue placeholder="Departemen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua departemen</SelectItem>
                      {SUPPORT_DEPARTMENT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                    onClick={applyFilters}
                  >
                    <Filter className="h-4 w-4" aria-hidden />
                    Terapkan Filter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterDepartment("all");
                      setPage(1);
                      void load({
                        targetPage: 1,
                        status: "all",
                        department: "all",
                      });
                    }}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Reset
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard
            icon={Ticket}
            title="Daftar Tiket"
            description={
              total > 0
                ? `${total} tiket ditemukan`
                : loading
                  ? "Memuat…"
                  : "Belum ada tiket"
            }
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => {
                  void load();
                  void loadCounts();
                }}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Muat Ulang
              </Button>
            }
          >
            {error && !loading ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Ticket className="h-12 w-12 text-slate-300" />
                <p className="max-w-sm text-sm text-slate-500">
                  Belum ada tiket masuk.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className={headCls}>Tiket</TableHead>
                        <TableHead className={headCls}>Pengguna</TableHead>
                        <TableHead className={headCls}>Departemen</TableHead>
                        <TableHead className={headCls}>Status</TableHead>
                        <TableHead className={headCls}>
                          Terakhir Diperbarui
                        </TableHead>
                        <TableHead className={`${headCls} text-right`}>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((t) => (
                        <TableRow
                          key={t.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <TicketStatusIcon ticket={t} />
                              <div className="min-w-0">
                                <Link
                                  href={`/dashboard/support/tickets/${t.id}`}
                                  className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                                >
                                  {t.title}
                                </Link>
                                <p className="text-xs text-slate-500">
                                  #{t.id}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[180px] py-4 text-sm">
                            <p className="font-medium text-slate-900">
                              {t.user?.name ?? "—"}
                            </p>
                            {t.user?.email ? (
                              <p className="truncate text-xs text-slate-500">
                                {t.user.email}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700">
                            {t.department_label ?? t.department}
                          </TableCell>
                          <TableCell className="py-4">
                            <TicketStatusPill ticket={t} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm text-slate-600">
                            {formatTicketDateTime(t.updated_at ?? t.created_at)}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 gap-1.5 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              asChild
                            >
                              <Link
                                href={`/dashboard/support/tickets/${t.id}`}
                                aria-label={`Lihat detail tiket: ${t.title}`}
                              >
                                <Eye className="h-4 w-4" aria-hidden />
                                Lihat Detail
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <ul className="flex flex-col gap-3 md:hidden">
                  {items.map((t) => (
                    <li key={t.id}>
                      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <TicketStatusIcon ticket={t} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/dashboard/support/tickets/${t.id}`}
                                className="min-w-0 text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                              >
                                {t.title}
                              </Link>
                              <TicketStatusPill ticket={t} className="shrink-0" />
                            </div>
                            {t.user?.name ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {t.user.name}
                              </p>
                            ) : null}
                            <p className="mt-2 text-xs text-slate-500">
                              {t.department_label ?? t.department} ·{" "}
                              {formatTicketDateTime(t.updated_at ?? t.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-full gap-1.5 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 sm:w-auto"
                            asChild
                          >
                            <Link
                              href={`/dashboard/support/tickets/${t.id}`}
                              aria-label={`Lihat detail tiket: ${t.title}`}
                            >
                              <Eye className="h-4 w-4" aria-hidden />
                              Lihat Detail
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <NumberedPagination
                  className="mt-4"
                  page={page}
                  lastPage={lastPage}
                  total={total}
                  perPage={perPage}
                  disabled={loading}
                  onPageChange={setPage}
                  onPerPageChange={handlePerPageChange}
                />
              </>
            )}
          </SectionCard>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Headphones, Loader2, RefreshCw, Search, Ticket } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupportTicketStatusBadge } from "@/components/support/support-ticket-status-badge";
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
import type { SupportTicketSummary } from "@/types/supportTicket";
import Link from "next/link";

export default function SupportTicketsListPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canManage = hasPermission("support.tickets.manage");
  const canAccessPage = canManage;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SupportTicketSummary[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterUserId, setFilterUserId] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState("");

  const load = useCallback(
    async (opts?: { targetPage?: number }) => {
      if (!canAccessPage) return;
      setLoading(true);
      setError(null);
      try {
        const pageToUse = opts?.targetPage ?? page;
        const params: Record<string, string | number> = {
          page: pageToUse,
          per_page: perPage,
        };
        if (canManage) {
          if (filterUserId.trim())
            params.user_id = Number(filterUserId.replace(/\D/g, ""));
          if (filterStatus !== "all") params.status = filterStatus;
          if (filterDepartment !== "all") params.department = filterDepartment;
          if (filterSearch.trim()) params.search = filterSearch.trim();
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
    [
      canAccessPage,
      page,
      perPage,
      filterUserId,
      filterStatus,
      filterDepartment,
      filterSearch,
    ]
  );

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
    void load({ targetPage: 1 });
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
          <div className="flex items-start gap-3">
            <Headphones className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Tiket bantuan
              </h1>
              <p className="text-muted-foreground text-sm">
                Kelola semua tiket pengguna (filter tersedia).
              </p>
            </div>
          </div>

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filter (admin)</CardTitle>
                <CardDescription>
                  Saring berdasarkan pengguna, status, departemen, atau kata
                  kunci.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    placeholder="User ID"
                    inputMode="numeric"
                    value={filterUserId}
                    onChange={(e) =>
                      setFilterUserId(e.target.value.replace(/\D/g, ""))
                    }
                    aria-label="Filter user ID"
                  />
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger aria-label="Filter status">
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
                    <SelectTrigger aria-label="Filter departemen">
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
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cari…"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), applyFilters())
                      }
                      aria-label="Pencarian"
                    />
                    <Button
                      type="button"
                      variant="blueGradient"
                      size="icon"
                      onClick={() => applyFilters()}
                      aria-label="Terapkan filter"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="blueGradient" onClick={() => applyFilters()}>
                    Terapkan filter
                  </Button>
                  <Button
                    type="button"
                    variant="blueGradientOutline"
                    onClick={() => {
                      setFilterUserId("");
                      setFilterStatus("all");
                      setFilterDepartment("all");
                      setFilterSearch("");
                      setPage(1);
                      void load({ targetPage: 1 });
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <section aria-labelledby="riwayat-tiket-heading">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle id="riwayat-tiket-heading" className="text-lg">
                    Tiket Masuk
                  </CardTitle>
                  <CardDescription>
                    {total > 0
                      ? `${total} tiket ditemukan`
                      : loading
                        ? "Memuat…"
                        : "Belum ada tiket"}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="blueGradientOutline"
                  size="sm"
                  onClick={() => void load()}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Muat ulang
                </Button>
              </CardHeader>
              <CardContent>
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
                    <p className="text-muted-foreground max-w-sm text-sm">
                      Belum ada tiket masuk.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto rounded-md border md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Judul</TableHead>
                                <TableHead>Departemen</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Update</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((t) => (
                                <TableRow key={t.id}>
                                  <TableCell className="max-w-[140px] text-sm">
                                    {t.user?.name ?? "—"}
                                    {t.user?.email ? (
                                      <div className="text-muted-foreground truncate text-xs">
                                        {t.user.email}
                                      </div>
                                    ) : null}
                                  </TableCell>
                                  <TableCell>
                                    <Link
                                      href={`/dashboard/support/tickets/${t.id}`}
                                      className="font-medium text-blue-600 hover:underline"
                                    >
                                      {t.title}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {t.department_label ?? t.department}
                                  </TableCell>
                                  <TableCell>
                                    <SupportTicketStatusBadge
                                      status={String(t.status)}
                                      statusLabel={t.status_label}
                                    >
                                      {t.status_label ?? t.status}
                                    </SupportTicketStatusBadge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                                    {formatTicketDateTime(
                                      t.updated_at ?? t.created_at
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                    </div>

                    <ul className="flex flex-col gap-3 md:hidden">
                      {items.map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/dashboard/support/tickets/${t.id}`}
                            className="block rounded-lg border bg-white p-4 shadow-sm transition hover:border-blue-300"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-slate-900">
                                {t.title}
                              </span>
                              <SupportTicketStatusBadge
                                status={String(t.status)}
                                statusLabel={t.status_label}
                                className="shrink-0"
                              >
                                {t.status_label ?? t.status}
                              </SupportTicketStatusBadge>
                            </div>
                            {t.user?.name ? (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {t.user.name}
                              </p>
                            ) : null}
                            <p className="text-muted-foreground mt-2 text-xs">
                              {t.department_label ?? t.department} ·{" "}
                              {formatTicketDateTime(t.updated_at ?? t.created_at)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {lastPage > 1 && (
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-muted-foreground text-sm">
                          Halaman {page} dari {lastPage}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="blueGradientOutline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                          >
                            Sebelumnya
                          </Button>
                          <Button
                            type="button"
                            variant="blueGradientOutline"
                            size="sm"
                            disabled={page >= lastPage || loading}
                            onClick={() =>
                              setPage((p) => Math.min(lastPage, p + 1))
                            }
                          >
                            Berikutnya
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Headphones, Loader2, RefreshCw, Ticket } from "lucide-react";

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
import { SupportTicketStatusBadge } from "@/components/support/support-ticket-status-badge";
import { useAuth } from "@/context/AuthContext";
import { getSupportTickets } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { normalizeSupportTicketsList } from "@/lib/supportTickets";
import { formatDateIdLong } from "@/lib/date";
import type { SupportTicketSummary } from "@/types/supportTicket";
import { SupportTicketCreateForm } from "@/components/support/support-ticket-create-form";

export default function NewSupportTicketPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canCreate = hasPermission("support.tickets.create");
  const canView = hasPermission("support.tickets.view");
  const canManage = hasPermission("support.tickets.manage");
  const canAccessPage = canCreate;
  const canAccessList = canView || canManage;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SupportTicketSummary[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadHistory = useCallback(
    async (targetPage = page) => {
      if (!canAccessList) return;
      setLoading(true);
      setError(null);
      try {
        const raw = await getSupportTickets({ page: targetPage, per_page: 10 });
        const n = normalizeSupportTicketsList(raw);
        setItems(n.items);
        setLastPage(n.lastPage);
        setTotal(n.total);
      } catch (e) {
        const msg =
          e instanceof AxiosError
            ? getAxiosErrorMessage(e, "Gagal memuat riwayat tiket.")
            : "Gagal memuat riwayat tiket.";
        setError(msg);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [canAccessList, page]
  );

  useEffect(() => {
    if (!authLoading && !canAccessPage) {
      router.replace("/dashboard");
    }
  }, [authLoading, canAccessPage, router]);

  useEffect(() => {
    if (!authLoading && canAccessList) {
      void loadHistory();
    }
  }, [authLoading, canAccessList, loadHistory]);

  const handleCreated = () => {
    if (!canAccessList) {
      toast.success("Tiket berhasil dibuat.");
      return;
    }
    setPage(1);
    void loadHistory(1);
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

  if (!canAccessPage) return null;

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
                Buat Tiket Bantuan
              </h1>
              <p className="text-muted-foreground text-sm">
                Kiri: form tiket baru. Kanan: riwayat tiket Anda.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <section
              id="support-ticket-form"
              aria-labelledby="form-tiket-heading"
              className="min-w-0 lg:sticky lg:top-4"
            >
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle id="form-tiket-heading" className="text-lg">
                    Form Tiket
                  </CardTitle>
                  <CardDescription>
                    Isi judul, pilih departemen, lalu kirim pesan/lampiran.
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[min(72vh,680px)] overflow-y-auto pr-1">
                  <SupportTicketCreateForm
                    navigateToDetail={false}
                    onSuccess={handleCreated}
                  />
                </CardContent>
              </Card>
            </section>

            <section aria-labelledby="riwayat-tiket-heading" className="min-w-0">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle id="riwayat-tiket-heading" className="text-lg">
                      Riwayat tiket
                    </CardTitle>
                    <CardDescription>
                      {canAccessList
                        ? total > 0
                          ? `${total} tiket ditemukan`
                          : loading
                            ? "Memuat…"
                            : "Belum ada tiket"
                        : "Riwayat tiket memerlukan permission support.tickets.view."}
                    </CardDescription>
                  </div>
                  {canAccessList && (
                    <Button
                      type="button"
                      variant="blueGradientOutline"
                      size="sm"
                      onClick={() => void loadHistory()}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                      Muat ulang
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!canAccessList ? (
                    <p className="text-muted-foreground text-sm">
                      Anda tetap bisa membuat tiket, namun riwayat tidak dapat
                      ditampilkan dengan permission saat ini.
                    </p>
                  ) : error && !loading ? (
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
                        Belum ada tiket. Gunakan form di sebelah kiri untuk
                        membuat tiket baru.
                      </p>
                    </div>
                  ) : (
                    <>
                      <ul className="flex flex-col gap-3">
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
                              <p className="text-muted-foreground mt-2 text-xs">
                                {t.department_label ?? t.department} ·{" "}
                                {formatDateIdLong(t.updated_at ?? t.created_at)}
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
                              onClick={() => {
                                const next = Math.max(1, page - 1);
                                setPage(next);
                                void loadHistory(next);
                              }}
                            >
                              Sebelumnya
                            </Button>
                            <Button
                              type="button"
                              variant="blueGradientOutline"
                              size="sm"
                              disabled={page >= lastPage || loading}
                              onClick={() => {
                                const next = Math.min(lastPage, page + 1);
                                setPage(next);
                                void loadHistory(next);
                              }}
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

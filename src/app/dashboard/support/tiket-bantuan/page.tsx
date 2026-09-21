"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  FileText,
  FilePlus2,
  Headphones,
  Loader2,
  MessageCircle,
  RefreshCw,
  Ticket,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatCard } from "@/components/redesign/stat-card";
import {
  TicketStatusIcon,
  TicketStatusPill,
} from "@/components/support/ticket-status-ui";
import { useAuth } from "@/context/AuthContext";
import { getSupportTickets } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { normalizeSupportTicketsList } from "@/lib/supportTickets";
import { resolveSupportTicketStatusKind } from "@/lib/supportTicketUi";
import { formatDateIdLong } from "@/lib/date";
import type { SupportTicketSummary } from "@/types/supportTicket";
import { SupportTicketCreateForm } from "@/components/support/support-ticket-create-form";

type Counts = {
  awaitingSupport: number;
  awaitingCustomer: number;
  done: number;
  total: number;
};

/** Batas aman jumlah halaman saat menghitung ringkasan (100 tiket/halaman). */
const COUNT_PAGE_SIZE = 100;
const COUNT_MAX_PAGES = 20;

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
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [counts, setCounts] = useState<Counts | null>(null);
  const [countsLoading, setCountsLoading] = useState(false);

  const loadHistory = useCallback(
    async (targetPage = page) => {
      if (!canAccessList) return;
      setLoading(true);
      setError(null);
      try {
        const raw = await getSupportTickets({
          page: targetPage,
          per_page: perPage,
        });
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
    [canAccessList, page, perPage]
  );

  /**
   * Ringkasan per status: seluruh tiket diambil (100 per halaman) lalu dihitung
   * di FE, karena filter `status` pada endpoint ini hanya terdokumentasi untuk
   * admin. Lihat docs/fe-be/support-tickets-ringkasan-status.md.
   */
  const loadCounts = useCallback(async () => {
    if (!canAccessList) return;
    setCountsLoading(true);
    try {
      const all: SupportTicketSummary[] = [];
      let current = 1;
      let last = 1;
      do {
        const raw = await getSupportTickets({
          page: current,
          per_page: COUNT_PAGE_SIZE,
        });
        const n = normalizeSupportTicketsList(raw);
        all.push(...n.items);
        last = n.lastPage;
        current += 1;
      } while (current <= last && current <= COUNT_MAX_PAGES);

      const next: Counts = {
        awaitingSupport: 0,
        awaitingCustomer: 0,
        done: 0,
        total: all.length,
      };
      for (const t of all) {
        const kind = resolveSupportTicketStatusKind(
          String(t.status),
          t.status_label
        );
        if (kind === "awaiting_support") next.awaitingSupport += 1;
        else if (kind === "awaiting_customer") next.awaitingCustomer += 1;
        else if (kind === "resolved" || kind === "closed") next.done += 1;
      }
      setCounts(next);
    } catch {
      setCounts(null);
    } finally {
      setCountsLoading(false);
    }
  }, [canAccessList]);

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

  useEffect(() => {
    if (!authLoading && canAccessList) {
      void loadCounts();
    }
  }, [authLoading, canAccessList, loadCounts]);

  const handleCreated = () => {
    if (!canAccessList) {
      toast.success("Tiket berhasil dibuat.");
      return;
    }
    setPage(1);
    void loadHistory(1);
    void loadCounts();
  };

  const statValue = (pick: (c: Counts) => number): string =>
    counts ? String(pick(counts)) : countsLoading ? "…" : "–";

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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Tiket Bantuan" },
            ]}
            icon={Headphones}
            title="Buat Tiket Bantuan"
            description="Buat tiket baru dan pantau riwayat tiket Anda."
          />

          {canAccessList && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Clock}
                tone="orange"
                title="Menunggu Tim Support"
                value={statValue((c) => c.awaitingSupport)}
                hint="Menunggu balasan tim support"
              />
              <StatCard
                icon={MessageCircle}
                tone="blue"
                title="Menunggu Balasan Anda"
                value={statValue((c) => c.awaitingCustomer)}
                hint="Butuh respon dari Anda"
              />
              <StatCard
                icon={CheckCircle2}
                tone="violet"
                title="Selesai"
                value={statValue((c) => c.done)}
                hint="Tiket telah diselesaikan"
              />
              <StatCard
                icon={FileText}
                tone="green"
                title="Semua Tiket"
                value={statValue((c) => c.total)}
                hint="Total seluruh tiket"
              />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="min-w-0">
              <SectionCard
                icon={FilePlus2}
                title="Form Tiket"
                description="Isi judul, pilih departemen, lalu kirim pesan/lampiran."
              >
                <SupportTicketCreateForm
                  navigateToDetail={false}
                  onSuccess={handleCreated}
                />
              </SectionCard>
            </div>

            <div className="min-w-0">
              <SectionCard
                icon={Ticket}
                title="Riwayat Tiket"
                description={
                  canAccessList
                    ? total > 0
                      ? `${total} tiket ditemukan`
                      : loading
                        ? "Memuat…"
                        : "Belum ada tiket"
                    : "Riwayat tiket memerlukan permission support.tickets.view."
                }
                action={
                  canAccessList ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => {
                        void loadHistory();
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
                  ) : undefined
                }
              >
                {!canAccessList ? (
                  <p className="text-sm text-slate-500">
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
                    <p className="max-w-sm text-sm text-slate-500">
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
                            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
                          >
                            <TicketStatusIcon ticket={t} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {t.title}
                                </span>
                                <TicketStatusPill
                                  ticket={t}
                                  className="shrink-0"
                                />
                              </div>
                              <p className="mt-1.5 text-xs text-slate-500">
                                #{t.id} · {t.department_label ?? t.department}{" "}
                                ·{" "}
                                {formatDateIdLong(t.updated_at ?? t.created_at)}
                              </p>
                            </div>
                          </Link>
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
                      onPerPageChange={(n) => {
                        setPerPage(n);
                        setPage(1);
                      }}
                    />
                  </>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

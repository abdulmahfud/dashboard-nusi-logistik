"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { ClaimStatusBadge } from "@/components/claims/claim-status-badge";
import { useAuth } from "@/context/AuthContext";
import { getPackageClaims, getPackageClaimStats } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { fetchAllVendors, getVendorLabel, type VendorOption } from "@/lib/vendorList";
import {
  CLAIM_STATUS_OPTIONS,
  claimIssueTypeLabel,
  claimStatusIcon,
  formatClaimDateTime,
} from "@/lib/packageClaimUi";
import { cn } from "@/lib/utils";
import type {
  PackageClaim,
  PackageClaimStats,
  PackageClaimsPaginator,
} from "@/types/packageClaim";

const headCls = "h-11 text-xs font-semibold text-slate-500";

const SUMMARY_CARDS: {
  value: string;
  countKey: keyof PackageClaimStats | "total";
  title: string;
  icon: LucideIcon;
  tile: string;
}[] = CLAIM_STATUS_OPTIONS.map((o) => ({
  value: o.value,
  countKey: o.value as keyof PackageClaimStats,
  title: o.label,
  icon: claimStatusIcon(o.value),
  tile: {
    diajukan: "bg-sky-50 text-sky-600",
    dalam_pemeriksaan: "bg-orange-50 text-orange-500",
    menunggu_dokumen: "bg-amber-50 text-amber-600",
    disetujui: "bg-emerald-50 text-emerald-600",
    ditolak: "bg-rose-50 text-rose-600",
    selesai: "bg-violet-50 text-violet-600",
  }[o.value]!,
}));

function unwrapStats(raw: unknown): PackageClaimStats | null {
  if (!raw || typeof raw !== "object") return null;
  const data = (raw as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  return data as PackageClaimStats;
}

function unwrapClaimsList(raw: unknown): {
  items: PackageClaim[];
  lastPage: number;
  total: number;
} {
  const empty = { items: [], lastPage: 1, total: 0 };
  if (!raw || typeof raw !== "object") return empty;
  const data = (raw as { data?: unknown }).data;
  if (!data || typeof data !== "object") return empty;
  const pag = data as PackageClaimsPaginator;
  if (!Array.isArray(pag.data)) return empty;
  return {
    items: pag.data,
    lastPage: pag.last_page ?? 1,
    total: pag.total ?? pag.data.length,
  };
}

export default function KlaimMasukPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canManage = hasPermission("claims.manage");
  const canAccessPage = canManage;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PackageClaim[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVendor, setFilterVendor] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  useEffect(() => {
    if (!canAccessPage) return;
    void fetchAllVendors()
      .then(setVendorOptions)
      .catch(() => setVendorOptions([]));
  }, [canAccessPage]);

  const [stats, setStats] = useState<PackageClaimStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!canAccessPage) return;
    setStatsLoading(true);
    try {
      const raw = await getPackageClaimStats();
      setStats(unwrapStats(raw));
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [canAccessPage]);

  const load = useCallback(
    async (opts?: {
      targetPage?: number;
      status?: string;
      vendor?: string;
      search?: string;
    }) => {
      if (!canAccessPage) return;
      setLoading(true);
      setError(null);
      try {
        const pageToUse = opts?.targetPage ?? page;
        const status = opts?.status !== undefined ? opts.status : filterStatus;
        const vendor = opts?.vendor !== undefined ? opts.vendor : filterVendor;
        const searchTerm = opts?.search !== undefined ? opts.search : search;
        const raw = await getPackageClaims({
          page: pageToUse,
          per_page: perPage,
          status: status !== "all" ? status : undefined,
          vendor: vendor !== "all" ? vendor : undefined,
          search: searchTerm.trim() ? searchTerm.trim() : undefined,
        });
        const n = unwrapClaimsList(raw);
        setItems(n.items);
        setLastPage(n.lastPage);
        setTotal(n.total);
      } catch (e) {
        const msg =
          e instanceof AxiosError
            ? getAxiosErrorMessage(e, "Gagal memuat klaim.")
            : "Gagal memuat klaim.";
        setError(msg);
        setItems([]);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [canAccessPage, page, perPage, filterStatus, filterVendor, search]
  );

  useEffect(() => {
    if (!authLoading && !canAccessPage) {
      router.replace("/dashboard");
    }
  }, [authLoading, canAccessPage, router]);

  useEffect(() => {
    if (!authLoading && canAccessPage) {
      void loadStats();
    }
  }, [authLoading, canAccessPage, loadStats]);

  useEffect(() => {
    if (!authLoading && canAccessPage) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canAccessPage, page, perPage]);

  const refreshAll = () => {
    void loadStats();
    void load();
  };

  const applyFilters = () => {
    setPage(1);
    void load({ targetPage: 1, status: filterStatus, vendor: filterVendor, search });
  };

  const resetFilters = () => {
    setFilterStatus("all");
    setFilterVendor("all");
    setSearch("");
    setPage(1);
    void load({ targetPage: 1, status: "all", vendor: "all", search: "" });
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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Klaim Masuk" },
            ]}
            icon={ShieldAlert}
            title="Klaim Masuk"
            description="Kelola semua klaim paket yang diajukan pengguna."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              const active = filterStatus === card.value;
              const count = stats?.[card.countKey as keyof PackageClaimStats];
              return (
                <button
                  key={card.value}
                  type="button"
                  onClick={() => {
                    setFilterStatus(card.value);
                    setPage(1);
                    void load({ targetPage: 1, status: card.value });
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50",
                    active ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-100"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                      card.tile
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-slate-900">
                      {card.title}
                    </span>
                    <span className="block text-xl font-bold tabular-nums text-slate-900">
                      {count !== undefined ? count : statsLoading ? "…" : "–"}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                </button>
              );
            })}
          </div>

          <SectionCard
            icon={SlidersHorizontal}
            title="Filter"
            description="Saring klaim berdasarkan status, ekspedisi, atau cari judul/resi."
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger aria-label="Filter status" className="h-11 rounded-lg border-slate-200 bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    {CLAIM_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterVendor} onValueChange={setFilterVendor}>
                  <SelectTrigger aria-label="Filter ekspedisi" className="h-11 rounded-lg border-slate-200 bg-white">
                    <SelectValue placeholder="Ekspedisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua ekspedisi</SelectItem>
                    {vendorOptions.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul atau nomor resi"
                  className="h-11 rounded-lg border-slate-200 bg-white"
                />
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
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reset
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={ShieldAlert}
            title="Daftar Klaim"
            description={
              total > 0
                ? `${total} klaim ditemukan`
                : loading
                  ? "Memuat…"
                  : "Belum ada klaim"
            }
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={refreshAll}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
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
                <ShieldAlert className="h-12 w-12 text-slate-300" />
                <p className="max-w-sm text-sm text-slate-500">Belum ada klaim masuk.</p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className={headCls}>Klaim</TableHead>
                        <TableHead className={headCls}>Pengguna</TableHead>
                        <TableHead className={headCls}>Ekspedisi</TableHead>
                        <TableHead className={headCls}>Jenis Kendala</TableHead>
                        <TableHead className={headCls}>Status</TableHead>
                        <TableHead className={headCls}>Diperbarui</TableHead>
                        <TableHead className={`${headCls} text-right`}>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((c) => (
                        <TableRow key={c.id} className="border-slate-100 hover:bg-slate-50/60">
                          <TableCell className="py-4">
                            <Link
                              href={`/dashboard/paket/klaim-paket/${c.id}`}
                              className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                            >
                              {c.title}
                            </Link>
                            <p className="text-xs text-slate-500">
                              #{c.id} · {c.reference_no}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[180px] py-4 text-sm">
                            <p className="font-medium text-slate-900">{c.user?.name ?? "—"}</p>
                            {c.user?.email ? (
                              <p className="truncate text-xs text-slate-500">{c.user.email}</p>
                            ) : null}
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700">
                            {getVendorLabel(c.vendor)}
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700">
                            {claimIssueTypeLabel(c.issue_type, c.issue_type_label)}
                          </TableCell>
                          <TableCell className="py-4">
                            <ClaimStatusBadge status={String(c.status)} statusLabel={c.status_label} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm text-slate-600">
                            {formatClaimDateTime(c.updated_at ?? c.created_at)}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 gap-1.5 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              asChild
                            >
                              <Link
                                href={`/dashboard/paket/klaim-paket/${c.id}`}
                                aria-label={`Lihat detail klaim: ${c.title}`}
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
                  {items.map((c) => (
                    <li key={c.id}>
                      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/dashboard/paket/klaim-paket/${c.id}`}
                            className="min-w-0 text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                          >
                            {c.title}
                          </Link>
                          <ClaimStatusBadge
                            status={String(c.status)}
                            statusLabel={c.status_label}
                            className="shrink-0"
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {c.user?.name ?? "—"} · {getVendorLabel(c.vendor)} · {c.reference_no}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatClaimDateTime(c.updated_at ?? c.created_at)}
                        </p>
                        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-full gap-1.5 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 sm:w-auto"
                            asChild
                          >
                            <Link
                              href={`/dashboard/paket/klaim-paket/${c.id}`}
                              aria-label={`Lihat detail klaim: ${c.title}`}
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
                  onPerPageChange={(n) => {
                    setPerPage(n);
                    setPage(1);
                  }}
                />
              </>
            )}
          </SectionCard>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

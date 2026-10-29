"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  FileWarning,
  Image as ImageIcon,
  Loader2,
  PackageSearch,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatCard } from "@/components/redesign/stat-card";
import { ClaimDetailDialog } from "@/components/claims/claim-detail-dialog";
import { ClaimStatusBadge } from "@/components/claims/claim-status-badge";
import { useAuth } from "@/context/AuthContext";
import {
  createPackageClaim,
  getPackageClaims,
  getPackageClaimStats,
} from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { fetchAllVendors, getVendorLabel, type VendorOption } from "@/lib/vendorList";
import {
  CLAIM_ACCEPT_FILES,
  CLAIM_DESCRIPTION_MAX,
  CLAIM_MAX_ATTACHMENT_BYTES,
  CLAIM_MAX_FILES,
  CLAIM_TITLE_MAX,
  formatBytes,
  validateClaimFiles,
} from "@/lib/claim-upload";
import {
  CLAIM_ISSUE_TYPE_OPTIONS,
  CLAIM_STATUS_OPTIONS,
  formatClaimDateTime,
} from "@/lib/packageClaimUi";
import { cn } from "@/lib/utils";
import type {
  PackageClaim,
  PackageClaimStats,
  PackageClaimsPaginator,
} from "@/types/packageClaim";

type StatusTabValue = "semua" | (typeof CLAIM_STATUS_OPTIONS)[number]["value"];

function unwrapStats(raw: unknown): PackageClaimStats | null {
  if (!raw || typeof raw !== "object") return null;
  const data = (raw as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  return data as PackageClaimStats;
}

function unwrapClaimsList(raw: unknown): {
  items: PackageClaim[];
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
} {
  const empty = { items: [], currentPage: 1, lastPage: 1, total: 0, perPage: 10 };
  if (!raw || typeof raw !== "object") return empty;
  const data = (raw as { data?: unknown }).data;
  if (!data || typeof data !== "object") return empty;
  const pag = data as PackageClaimsPaginator;
  if (!Array.isArray(pag.data)) return empty;
  return {
    items: pag.data,
    currentPage: pag.current_page ?? 1,
    lastPage: pag.last_page ?? 1,
    total: pag.total ?? pag.data.length,
    perPage: pag.per_page ?? 10,
  };
}

export default function KlaimPaketPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canView = hasPermission("claims.view");
  const canCreate = hasPermission("claims.create");
  const canManage = hasPermission("claims.manage");
  const canAccessPage = canView || canCreate;

  // ---- Stats ----
  const [stats, setStats] = useState<PackageClaimStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!canView) return;
    setStatsLoading(true);
    try {
      const raw = await getPackageClaimStats();
      setStats(unwrapStats(raw));
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [canView]);

  // ---- Vendor options ----
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);

  useEffect(() => {
    if (!canCreate) return;
    void fetchAllVendors()
      .then(setVendorOptions)
      .catch(() => setVendorOptions([]));
  }, [canCreate]);

  // ---- History list ----
  const [statusTab, setStatusTab] = useState<StatusTabValue>("semua");
  const [items, setItems] = useState<PackageClaim[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(
    async (targetPage = page, targetStatus = statusTab, targetPerPage = perPage) => {
      if (!canView) return;
      setLoading(true);
      setError(null);
      try {
        const raw = await getPackageClaims({
          page: targetPage,
          per_page: targetPerPage,
          status: targetStatus === "semua" ? undefined : targetStatus,
        });
        const n = unwrapClaimsList(raw);
        setItems(n.items);
        setLastPage(n.lastPage);
        setTotal(n.total);
      } catch (e) {
        const msg =
          e instanceof AxiosError
            ? getAxiosErrorMessage(e, "Gagal memuat riwayat klaim.")
            : "Gagal memuat riwayat klaim.";
        setError(msg);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [canView, page, statusTab, perPage]
  );

  useEffect(() => {
    if (!authLoading && !canAccessPage) {
      router.replace("/dashboard");
    }
  }, [authLoading, canAccessPage, router]);

  useEffect(() => {
    if (!authLoading && canView) {
      void loadStats();
    }
  }, [authLoading, canView, loadStats]);

  useEffect(() => {
    if (!authLoading && canView) {
      void loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canView, page, statusTab, perPage]);

  const refreshAll = () => {
    void loadStats();
    void loadHistory();
  };

  // ---- Form ----
  const [referenceNo, setReferenceNo] = useState("");
  const [vendor, setVendor] = useState("");
  const [issueType, setIssueType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleLen = title.length;
  const descriptionLen = description.length;

  const handleFilesChange = (list: File[]) => {
    setFileHint(null);
    if (list.length === 0) {
      setFiles([]);
      return;
    }
    const v = validateClaimFiles(list);
    v.info.forEach((m) => toast.info(m));
    if (!v.ok) {
      v.errors.forEach((m) => toast.error(m));
      setFiles([]);
      return;
    }
    setFiles(v.accepted);
    if (v.info.length) setFileHint(v.info.join(" "));
  };

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileHint(null);
  };

  const resetForm = () => {
    setReferenceNo("");
    setVendor("");
    setIssueType("");
    setTitle("");
    setDescription("");
    setFiles([]);
    setFileHint(null);
  };

  const handleCekResi = () => {
    const resi = referenceNo.trim();
    if (!resi) {
      toast.error("Masukkan nomor resi terlebih dahulu.");
      return;
    }
    window.open(
      `/dashboard/tracking?resi=${encodeURIComponent(resi)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resi = referenceNo.trim();
    const t = title.trim();
    const desc = description.trim();

    if (!resi) {
      toast.error("Nomor resi wajib diisi.");
      return;
    }
    if (!vendor) {
      toast.error("Pilih ekspedisi.");
      return;
    }
    if (!issueType) {
      toast.error("Pilih jenis kendala.");
      return;
    }
    if (!t) {
      toast.error("Judul klaim wajib diisi.");
      return;
    }
    if (t.length > CLAIM_TITLE_MAX) {
      toast.error(`Judul maksimal ${CLAIM_TITLE_MAX} karakter.`);
      return;
    }
    if (!desc) {
      toast.error("Deskripsi kendala wajib diisi.");
      return;
    }
    if (desc.length > CLAIM_DESCRIPTION_MAX) {
      toast.error(`Deskripsi maksimal ${CLAIM_DESCRIPTION_MAX} karakter.`);
      return;
    }

    const recheck = validateClaimFiles(files);
    if (!recheck.ok) {
      recheck.errors.forEach((m) => toast.error(m));
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("reference_no", resi);
      fd.append("vendor", vendor);
      fd.append("issue_type", issueType);
      fd.append("title", t);
      fd.append("description", desc);
      recheck.accepted.forEach((f) => fd.append("attachments[]", f));

      await createPackageClaim(fd);
      toast.success("Klaim berhasil diajukan.");
      resetForm();
      setStatusTab("semua");
      setPage(1);
      refreshAll();
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal mengajukan klaim.")
          : "Gagal mengajukan klaim."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Detail dialog ----
  const [selectedClaim, setSelectedClaim] = useState<PackageClaim | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (claim: PackageClaim) => {
    setSelectedClaim(claim);
    setDetailOpen(true);
  };

  const statusTabs = useMemo(
    () => [
      { value: "semua" as StatusTabValue, label: "Semua" },
      ...CLAIM_STATUS_OPTIONS,
    ],
    []
  );

  const tabCount = (value: StatusTabValue): number | null => {
    if (!stats) return null;
    if (value === "semua") {
      return Object.values(stats).reduce((a, b) => a + b, 0);
    }
    return stats[value as keyof PackageClaimStats] ?? 0;
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
              { label: "Klaim Paket" },
            ]}
            icon={ShieldAlert}
            title="Ajukan Klaim Paket"
            description="Laporkan kendala pengiriman (hilang, rusak, dll.) dan pantau statusnya."
          />

          {canView && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatCard
                icon={Clock}
                tone="blue"
                title="Diajukan"
                value={statsLoading && !stats ? "…" : String(stats?.diajukan ?? 0)}
              />
              <StatCard
                icon={FileWarning}
                tone="orange"
                title="Dalam Pemeriksaan"
                value={statsLoading && !stats ? "…" : String(stats?.dalam_pemeriksaan ?? 0)}
              />
              <StatCard
                icon={FileUp}
                tone="orange"
                title="Menunggu Dokumen"
                value={statsLoading && !stats ? "…" : String(stats?.menunggu_dokumen ?? 0)}
              />
              <StatCard
                icon={CheckCircle2}
                tone="green"
                title="Disetujui"
                value={statsLoading && !stats ? "…" : String(stats?.disetujui ?? 0)}
              />
              <StatCard
                icon={XCircle}
                tone="red"
                title="Ditolak"
                value={statsLoading && !stats ? "…" : String(stats?.ditolak ?? 0)}
              />
              <StatCard
                icon={ShieldCheck}
                tone="slate"
                title="Selesai"
                value={statsLoading && !stats ? "…" : String(stats?.selesai ?? 0)}
              />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="min-w-0">
              {!canCreate ? (
                <SectionCard
                  icon={PackageSearch}
                  title="Formulir Klaim Paket"
                  description="Anda tidak memiliki izin untuk mengajukan klaim (claims.create)."
                >
                  <p className="text-sm text-slate-500">
                    Hubungi admin jika Anda perlu mengajukan klaim paket.
                  </p>
                </SectionCard>
              ) : (
                <SectionCard
                  icon={PackageSearch}
                  title="Formulir Klaim Paket"
                  description="Isi data pengiriman dan jelaskan kendala yang terjadi."
                >
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="kp-resi">Nomor Resi</Label>
                      <div className="flex gap-2">
                        <Input
                          id="kp-resi"
                          value={referenceNo}
                          onChange={(e) => setReferenceNo(e.target.value)}
                          placeholder="Masukkan nomor resi"
                          autoComplete="off"
                          className="h-11 rounded-lg border-slate-200 bg-white"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 shrink-0 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={handleCekResi}
                        >
                          Cek Resi
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kp-vendor">Ekspedisi</Label>
                      <Select value={vendor} onValueChange={setVendor}>
                        <SelectTrigger id="kp-vendor" className="h-11 rounded-lg border-slate-200 bg-white">
                          <SelectValue placeholder="Pilih ekspedisi" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendorOptions.map((v) => (
                            <SelectItem key={v.value} value={v.value}>
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kp-issue">Jenis Kendala</Label>
                      <Select value={issueType} onValueChange={setIssueType}>
                        <SelectTrigger id="kp-issue" className="h-11 rounded-lg border-slate-200 bg-white">
                          <SelectValue placeholder="Pilih jenis kendala" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLAIM_ISSUE_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="kp-title">Judul Klaim</Label>
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            titleLen > CLAIM_TITLE_MAX
                              ? "text-destructive font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {titleLen}/{CLAIM_TITLE_MAX}
                        </span>
                      </div>
                      <Input
                        id="kp-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, CLAIM_TITLE_MAX))}
                        placeholder="Ringkasan singkat kendala"
                        maxLength={CLAIM_TITLE_MAX}
                        className="h-11 rounded-lg border-slate-200 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="kp-desc">Deskripsi Kendala</Label>
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            descriptionLen > CLAIM_DESCRIPTION_MAX
                              ? "text-destructive font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {descriptionLen}/{CLAIM_DESCRIPTION_MAX}
                        </span>
                      </div>
                      <Textarea
                        id="kp-desc"
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value.slice(0, CLAIM_DESCRIPTION_MAX))
                        }
                        placeholder="Ceritakan detail kendala pengiriman…"
                        rows={5}
                        className="min-h-[100px] resize-y rounded-lg border-slate-200 bg-white"
                        maxLength={CLAIM_DESCRIPTION_MAX}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kp-files">
                        Lampiran <span className="font-normal text-slate-400">(opsional)</span>
                      </Label>
                      <div
                        className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-within:border-blue-400"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFilesChange(Array.from(e.dataTransfer.files ?? []));
                        }}
                      >
                        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <FileUp className="h-5 w-5" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">
                              Seret file ke sini atau klik untuk memilih
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              JPG, PNG, PDF · maks. {formatBytes(CLAIM_MAX_ATTACHMENT_BYTES)} per
                              file · maks. {CLAIM_MAX_FILES} file
                            </p>
                          </div>
                          <Input
                            id="kp-files"
                            type="file"
                            accept={CLAIM_ACCEPT_FILES}
                            multiple
                            className="sr-only"
                            onChange={(e) => {
                              const list = e.target.files ? Array.from(e.target.files) : [];
                              handleFilesChange(list);
                              e.target.value = "";
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => document.getElementById("kp-files")?.click()}
                          >
                            Pilih file
                          </Button>
                        </div>
                      </div>
                      {fileHint ? (
                        <p className="text-muted-foreground text-xs" role="status">
                          {fileHint}
                        </p>
                      ) : null}
                      {files.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                          {files.map((f, index) => (
                            <li
                              key={`${f.name}-${f.size}-${index}`}
                              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2 shadow-sm"
                            >
                              {f.type.startsWith("image/") ? (
                                <ImageIcon className="h-4 w-4 shrink-0 text-slate-500" />
                              ) : (
                                <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                              )}
                              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">
                                {f.name}
                              </span>
                              <span className="shrink-0 text-xs text-slate-400">
                                {formatBytes(f.size)}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => removeFileAt(index)}
                                aria-label={`Hapus ${f.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-11 w-full gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700 sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mengirim…
                        </>
                      ) : (
                        "Kirim Klaim"
                      )}
                    </Button>
                  </form>
                </SectionCard>
              )}
            </div>

            <div className="min-w-0">
              <SectionCard
                icon={ShieldAlert}
                title="Riwayat Klaim Paket"
                description={
                  canView
                    ? total > 0
                      ? `${total} klaim ditemukan`
                      : loading
                        ? "Memuat…"
                        : "Belum ada klaim"
                    : "Riwayat klaim memerlukan permission claims.view."
                }
                action={
                  canView ? (
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
                  ) : undefined
                }
              >
                {!canView ? (
                  <p className="text-sm text-slate-500">
                    Anda tidak memiliki izin untuk melihat riwayat klaim.
                  </p>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {statusTabs.map((t) => {
                        const count = tabCount(t.value);
                        const active = statusTab === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => {
                              setStatusTab(t.value);
                              setPage(1);
                            }}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                              active
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {t.label}
                            {count !== null ? ` (${count})` : ""}
                          </button>
                        );
                      })}
                    </div>

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
                        <p className="max-w-sm text-sm text-slate-500">
                          Belum ada klaim pada status ini.
                        </p>
                      </div>
                    ) : (
                      <>
                        <ul className="flex flex-col gap-3">
                          {items.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => openDetail(c)}
                                className="flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-900">
                                      {c.title}
                                    </span>
                                    <ClaimStatusBadge
                                      status={String(c.status)}
                                      statusLabel={c.status_label}
                                      className="shrink-0"
                                    />
                                  </div>
                                  <p className="mt-1.5 text-xs text-slate-500">
                                    #{c.id} · {getVendorLabel(c.vendor)} · {c.reference_no}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-400">
                                    Diajukan {formatClaimDateTime(c.created_at)}
                                  </p>
                                </div>
                              </button>
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
                  </>
                )}
              </SectionCard>
            </div>
          </div>
        </div>

        <ClaimDetailDialog
          claim={selectedClaim}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          canManage={canManage}
          onUpdated={(updated) => {
            setSelectedClaim(updated);
            refreshAll();
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

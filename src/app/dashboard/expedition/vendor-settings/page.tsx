"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2, RefreshCw, Save, Settings, Truck } from "lucide-react";
import Image from "next/image";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import {
  getExpeditionVendorSettings,
  patchExpeditionVendorSettings,
} from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import type { ExpeditionVendorSetting } from "@/types/expeditionVendorSettings";
import { formatDateIdLong } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Logo per vendor (kunci = `vendor` lowercase). Vendor tanpa logo memakai ikon truk. */
const VENDOR_LOGO: Record<string, string> = {
  anteraja: "/images/anteraja.png",
  idexpress: "/images/idx.png",
  jne: "/images/jne.png",
  jntcargo: "/images/jnt-cargo.png",
  jntexpress: "/images/jnt.png",
  lion: "/images/lion.png",
  ncs: "/images/ncs.png",
  ninja: "/images/ninja.png",
  ninjaexpress: "/images/ninja.png",
  paxel: "/images/paxel.png",
  posindonesia: "/images/pos-indonesia.png",
  sap: "/images/sap-new.png",
  sicepat: "/images/sicepat.png",
  tiki: "/images/tiki.png",
};

function VendorCell({ vendor }: { vendor: string }) {
  const logo = VENDOR_LOGO[vendor.trim().toLowerCase()];
  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={72}
          height={28}
          className="h-7 w-[72px] object-contain object-left"
        />
      ) : (
        <span className="flex h-7 w-[72px] items-center">
          <Truck className="h-5 w-5 text-slate-400" aria-hidden />
        </span>
      )}
      <span className="text-sm font-medium text-slate-900">{vendor}</span>
    </div>
  );
}

const headCls = "h-11 text-xs font-semibold text-slate-500";
const switchCls =
  "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200";

type DraftRow = {
  is_active: boolean;
  is_cod_active: boolean;
  note: string;
};

function toDraft(row: ExpeditionVendorSetting): DraftRow {
  return {
    is_active: row.is_active,
    is_cod_active: row.is_cod_active,
    note: row.note ?? "",
  };
}

function draftDirty(row: ExpeditionVendorSetting, draft: DraftRow): boolean {
  return (
    row.is_active !== draft.is_active ||
    row.is_cod_active !== draft.is_cod_active ||
    (row.note ?? "") !== draft.note
  );
}

export default function ExpeditionVendorSettingsPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  /** Sama dengan item sidebar: hanya yang punya update yang boleh akses halaman ini. */
  const canUpdate = hasPermission("expedition.settings.update");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ExpeditionVendorSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<number, DraftRow>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const load = useCallback(async () => {
    if (!canUpdate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getExpeditionVendorSettings();
      const list = Array.isArray(res.data) ? [...res.data] : [];

      // Pastikan vendor SAP muncul pada list pengaturan.
      const hasSap = list.some(
        (item) => item.vendor.trim().toLowerCase() === "sap"
      );
      if (!hasSap) {
        const maxId = list.reduce((acc, item) => Math.max(acc, item.id), 0);
        const nowIso = new Date().toISOString();
        list.push({
          id: maxId + 1,
          vendor: "sap",
          is_active: true,
          is_cod_active: true,
          note: "Auto-added dari frontend (vendor SAP).",
          created_at: nowIso,
          updated_at: nowIso,
          vendor_code: "SAP",
          eligible_for_pricing_rules: true,
        });
      }

      setRows(list);
      const next: Record<number, DraftRow> = {};
      for (const r of list) {
        next[r.id] = toDraft(r);
      }
      setDrafts(next);
    } catch (e) {
      setError(
        e instanceof AxiosError
          ? getAxiosErrorMessage(e, "Gagal memuat pengaturan ekspedisi.")
          : "Gagal memuat pengaturan ekspedisi.",
      );
      setRows([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, [canUpdate]);

  useEffect(() => {
    if (!authLoading && !canUpdate) {
      router.replace("/dashboard");
    }
  }, [authLoading, canUpdate, router]);

  useEffect(() => {
    if (!authLoading && canUpdate) {
      void load();
    }
  }, [authLoading, canUpdate, load]);

  const updateDraft = (id: number, patch: Partial<DraftRow>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSave = async (row: ExpeditionVendorSetting) => {
    const draft = drafts[row.id];
    if (!draft || !canUpdate) return;
    const body: {
      is_active?: boolean;
      is_cod_active?: boolean;
      note?: string | null;
    } = {};
    if (row.is_active !== draft.is_active) body.is_active = draft.is_active;
    if (row.is_cod_active !== draft.is_cod_active)
      body.is_cod_active = draft.is_cod_active;
    if ((row.note ?? "") !== draft.note) body.note = draft.note || null;

    if (Object.keys(body).length === 0) {
      toast.info("Tidak ada perubahan.");
      return;
    }

    setSavingId(row.id);
    try {
      const res = await patchExpeditionVendorSettings(row.vendor, body);
      if (res.success === false) {
        toast.error(res.message || "Gagal menyimpan.");
        return;
      }
      toast.success(res.message || "Pengaturan disimpan.");
      await load();
    } catch (e) {
      toast.error(
        e instanceof AxiosError
          ? getAxiosErrorMessage(e, "Gagal menyimpan pengaturan.")
          : "Gagal menyimpan pengaturan.",
      );
    } finally {
      setSavingId(null);
    }
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

  if (!canUpdate) {
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

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Pengaturan Ekspedisi" },
            ]}
            icon={Settings}
            title="Pengaturan Ekspedisi"
            description="Nonaktifkan layanan vendor atau hanya COD. Order non‑COD tetap boleh jika COD dimatikan."
            illustration="/images/parcel.png"
            illustrationClassName="w-[120px]"
          />

          <SectionCard
            icon={Truck}
            title="Daftar Vendor Ekspedisi"
            description={
              canUpdate
                ? "Ubah toggle atau catatan, lalu simpan per baris."
                : "Anda hanya dapat melihat pengaturan."
            }
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => void load()}
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
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada data pengaturan vendor.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader className="bg-slate-50/60">
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className={headCls}>Vendor</TableHead>
                        <TableHead className={`${headCls} whitespace-nowrap`}>
                          Aktif
                        </TableHead>
                        <TableHead className={`${headCls} whitespace-nowrap`}>
                          COD Aktif
                        </TableHead>
                        <TableHead className={`${headCls} min-w-[220px]`}>
                          Catatan
                        </TableHead>
                        <TableHead className={`${headCls} whitespace-nowrap`}>
                          Diperbarui
                        </TableHead>
                        {canUpdate && (
                          <TableHead className={`${headCls} text-right`}>
                            Aksi
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows
                        .slice((page - 1) * perPage, page * perPage)
                        .map((row) => {
                          const draft = drafts[row.id];
                          const dirty = draft != null && draftDirty(row, draft);
                          const disabled = !canUpdate || savingId === row.id;

                          return (
                            <TableRow
                              key={row.id}
                              className="border-slate-100 hover:bg-slate-50/60"
                            >
                              <TableCell className="py-4">
                                <VendorCell vendor={row.vendor} />
                              </TableCell>
                              <TableCell className="py-4">
                                <Switch
                                  checked={draft?.is_active ?? row.is_active}
                                  onCheckedChange={(v) =>
                                    updateDraft(row.id, { is_active: v })
                                  }
                                  disabled={disabled}
                                  aria-label="Vendor aktif"
                                  className={switchCls}
                                />
                              </TableCell>
                              <TableCell className="py-4">
                                <Switch
                                  checked={
                                    draft?.is_cod_active ?? row.is_cod_active
                                  }
                                  onCheckedChange={(v) =>
                                    updateDraft(row.id, { is_cod_active: v })
                                  }
                                  disabled={disabled}
                                  aria-label="COD aktif"
                                  className={switchCls}
                                />
                              </TableCell>
                              <TableCell className="py-4">
                                <Textarea
                                  value={draft?.note ?? ""}
                                  onChange={(e) =>
                                    updateDraft(row.id, {
                                      note: e.target.value,
                                    })
                                  }
                                  disabled={disabled}
                                  rows={1}
                                  placeholder="Tambahkan catatan (opsional)..."
                                  className="min-h-[44px] resize-y rounded-lg border-slate-200 bg-white text-sm"
                                />
                              </TableCell>
                              <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                                {formatDateIdLong(row.updated_at)}
                              </TableCell>
                              {canUpdate && (
                                <TableCell className="py-4 text-right">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleSave(row)}
                                    disabled={
                                      savingId === row.id || !dirty || !draft
                                    }
                                    className={cn(
                                      "h-9 gap-1.5 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700",
                                      dirty &&
                                        "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                    )}
                                  >
                                    {savingId === row.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Menyimpan
                                      </>
                                    ) : (
                                      <>
                                        <Save className="h-4 w-4" aria-hidden />
                                        Simpan
                                      </>
                                    )}
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
                <NumberedPagination
                  className="mt-2"
                  page={page}
                  lastPage={Math.max(1, Math.ceil(rows.length / perPage))}
                  total={rows.length}
                  perPage={perPage}
                  onPageChange={setPage}
                  onPerPageChange={(n) => {
                    setPerPage(n);
                    setPage(1);
                  }}
                />
              </>
            )}
          </SectionCard>

          {!canUpdate && (
            <p className="text-sm text-slate-500">
              Izin <span className="font-mono">expedition.settings.update</span>{" "}
              diperlukan untuk mengubah pengaturan.
            </p>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

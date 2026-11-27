"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { CreditCard, Loader2, RefreshCw, Save, Star } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
  getPaymentGatewaySettings,
  patchPaymentGatewaySettings,
} from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import type { PaymentGatewaySetting } from "@/types/paymentGatewaySettings";
import { formatDateIdLong } from "@/lib/date";
import { cn } from "@/lib/utils";

const GATEWAY_LABELS: Record<string, string> = {
  xendit: "Xendit",
  midtrans: "Midtrans",
};

const headCls = "h-11 text-xs font-semibold text-slate-500";
const switchCls =
  "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200";

type DraftRow = {
  is_active: boolean;
  note: string;
};

function toDraft(row: PaymentGatewaySetting): DraftRow {
  return { is_active: row.is_active, note: row.note ?? "" };
}

function draftDirty(row: PaymentGatewaySetting, draft: DraftRow): boolean {
  return row.is_active !== draft.is_active || (row.note ?? "") !== draft.note;
}

export default function PaymentGatewaySettingsPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canUpdate = hasPermission("payments.gateway_settings.update");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PaymentGatewaySetting[]>([]);
  const [drafts, setDrafts] = useState<Record<number, DraftRow>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canUpdate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPaymentGatewaySettings();
      const list = Array.isArray(res.data) ? res.data : [];
      setRows(list);
      const next: Record<number, DraftRow> = {};
      for (const r of list) {
        next[r.id] = toDraft(r);
      }
      setDrafts(next);
    } catch (e) {
      setError(
        e instanceof AxiosError
          ? getAxiosErrorMessage(e, "Gagal memuat pengaturan gateway pembayaran.")
          : "Gagal memuat pengaturan gateway pembayaran."
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
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleSave = async (row: PaymentGatewaySetting) => {
    const draft = drafts[row.id];
    if (!draft || !canUpdate) return;
    const body: { is_active?: boolean; note?: string | null } = {};
    if (row.is_active !== draft.is_active) body.is_active = draft.is_active;
    if ((row.note ?? "") !== draft.note) body.note = draft.note || null;

    if (Object.keys(body).length === 0) {
      toast.info("Tidak ada perubahan.");
      return;
    }

    setSavingId(row.id);
    try {
      const res = await patchPaymentGatewaySettings(row.gateway, body);
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
          : "Gagal menyimpan pengaturan."
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleSetDefault = async (row: PaymentGatewaySetting) => {
    if (!canUpdate || row.is_default) return;
    setSavingId(row.id);
    try {
      const res = await patchPaymentGatewaySettings(row.gateway, {
        is_default: true,
      });
      if (res.success === false) {
        toast.error(res.message || "Gagal menjadikan default.");
        return;
      }
      toast.success(
        `${GATEWAY_LABELS[row.gateway] ?? row.gateway} dijadikan gateway default.`
      );
      await load();
    } catch (e) {
      toast.error(
        e instanceof AxiosError
          ? getAxiosErrorMessage(e, "Gagal menjadikan default.")
          : "Gagal menjadikan default."
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
              { label: "Gateway Pembayaran" },
            ]}
            icon={CreditCard}
            title="Gateway Pembayaran"
            description="Pilih gateway yang dipakai checkout 'Pembayaran Online' (Wallet tidak terpengaruh). Hanya satu gateway yang bisa jadi default."
          />

          <SectionCard
            icon={CreditCard}
            title="Daftar Gateway"
            description={
              canUpdate
                ? "Ubah toggle aktif/catatan lalu simpan, atau jadikan salah satu default."
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
                Belum ada data pengaturan gateway.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/60">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className={headCls}>Gateway</TableHead>
                      <TableHead className={`${headCls} whitespace-nowrap`}>
                        Aktif
                      </TableHead>
                      <TableHead className={`${headCls} whitespace-nowrap`}>
                        Default
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
                    {rows.map((row) => {
                      const draft = drafts[row.id];
                      const dirty = draft != null && draftDirty(row, draft);
                      const disabled = !canUpdate || savingId === row.id;

                      return (
                        <TableRow
                          key={row.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <CreditCard
                                className="h-5 w-5 text-slate-400"
                                aria-hidden
                              />
                              <span className="text-sm font-medium text-slate-900">
                                {GATEWAY_LABELS[row.gateway] ?? row.gateway}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Switch
                              checked={draft?.is_active ?? row.is_active}
                              onCheckedChange={(v) =>
                                updateDraft(row.id, { is_active: v })
                              }
                              disabled={disabled}
                              aria-label="Gateway aktif"
                              className={switchCls}
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            {row.is_default ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                <Star
                                  className="h-3.5 w-3.5 fill-blue-600 text-blue-600"
                                  aria-hidden
                                />
                                Default
                              </span>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void handleSetDefault(row)}
                                disabled={disabled}
                                className="h-8 gap-1.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
                              >
                                <Star className="h-3.5 w-3.5" aria-hidden />
                                Jadikan Default
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <Textarea
                              value={draft?.note ?? ""}
                              onChange={(e) =>
                                updateDraft(row.id, { note: e.target.value })
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
            )}
          </SectionCard>

          {!canUpdate && (
            <p className="text-sm text-slate-500">
              Izin{" "}
              <span className="font-mono">
                payments.gateway_settings.update
              </span>{" "}
              diperlukan untuk mengubah pengaturan.
            </p>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

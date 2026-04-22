"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2, RefreshCw, Truck } from "lucide-react";

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
          <div className="flex items-center gap-2">
            <Truck className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Pengaturan ekspedisi
              </h1>
              <p className="text-muted-foreground text-sm">
                Nonaktifkan layanan vendor atau hanya COD. Order non‑COD tetap
                boleh jika COD dimatikan.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-lg">Vendor</CardTitle>
                <CardDescription>
                  {canUpdate
                    ? "Ubah toggle atau catatan, lalu simpan per baris."
                    : "Anda hanya dapat melihat pengaturan."}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
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
              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : rows.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Belum ada data pengaturan vendor.
                </p>
              ) : (
                <div className="max-h-[min(640px,75vh)] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="whitespace-nowrap">
                          Aktif
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          COD aktif
                        </TableHead>
                        <TableHead className="min-w-[200px]">Catatan</TableHead>
                        <TableHead className="whitespace-nowrap">
                          Diperbarui
                        </TableHead>
                        {canUpdate && (
                          <TableHead className="text-right">Aksi</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => {
                        const draft = drafts[row.id];
                        const dirty = draft != null && draftDirty(row, draft);
                        const disabled = !canUpdate || savingId === row.id;

                        return (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono text-sm font-medium">
                              {row.vendor}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={draft?.is_active ?? row.is_active}
                                onCheckedChange={(v) =>
                                  updateDraft(row.id, { is_active: v })
                                }
                                disabled={disabled}
                                aria-label="Vendor aktif"
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={
                                  draft?.is_cod_active ?? row.is_cod_active
                                }
                                onCheckedChange={(v) =>
                                  updateDraft(row.id, { is_cod_active: v })
                                }
                                disabled={disabled}
                                aria-label="COD aktif"
                              />
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={draft?.note ?? ""}
                                onChange={(e) =>
                                  updateDraft(row.id, { note: e.target.value })
                                }
                                disabled={disabled}
                                rows={2}
                                className="min-h-[60px] resize-y text-sm"
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {formatDateIdLong(row.updated_at)}
                            </TableCell>
                            {canUpdate && (
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => void handleSave(row)}
                                  disabled={
                                    savingId === row.id || !dirty || !draft
                                  }
                                >
                                  {savingId === row.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Menyimpan
                                    </>
                                  ) : (
                                    "Simpan"
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
            </CardContent>
          </Card>

          {!canUpdate && (
            <p className="text-muted-foreground text-sm">
              Izin <span className="font-mono">expedition.settings.update</span>{" "}
              diperlukan untuk mengubah pengaturan.
            </p>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

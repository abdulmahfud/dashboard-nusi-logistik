"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  Boxes,
  Edit,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Truck,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import {
  getExpeditionGroups,
  createExpeditionGroup,
  updateExpeditionGroup,
  deleteExpeditionGroup,
  resetDefaultExpeditionGroups,
} from "@/lib/apiClient";
import type {
  ExpeditionGroup,
  ExpeditionGroupPayload,
} from "@/types/expeditionGroup";

const headCls = "h-11 text-xs font-semibold text-slate-500";
const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-700";

type FormState = {
  name: string;
  slug: string;
  estimasi_dalam_kota: string;
  estimasi_dalam_pulau: string;
  estimasi_luar_pulau: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  estimasi_dalam_kota: "",
  estimasi_dalam_pulau: "",
  estimasi_luar_pulau: "",
  description: "",
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function toForm(group: ExpeditionGroup): FormState {
  return {
    name: group.name,
    slug: group.slug,
    estimasi_dalam_kota: group.estimasi_dalam_kota ?? "",
    estimasi_dalam_pulau: group.estimasi_dalam_pulau ?? "",
    estimasi_luar_pulau: group.estimasi_luar_pulau ?? "",
    description: group.description ?? "",
  };
}

function toPayload(form: FormState): ExpeditionGroupPayload {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    estimasi_dalam_kota: form.estimasi_dalam_kota.trim() || null,
    estimasi_dalam_pulau: form.estimasi_dalam_pulau.trim() || null,
    estimasi_luar_pulau: form.estimasi_luar_pulau.trim() || null,
    description: form.description.trim() || null,
  };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    if (data?.errors) return Object.values(data.errors).flat()[0] || fallback;
    return data?.message || fallback;
  }
  return fallback;
}

export default function ExpeditionGroupsPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canView = hasPermission("expedition-groups.view");
  const canCreate = hasPermission("expedition-groups.create");
  const canUpdate = hasPermission("expedition-groups.update");
  const canDelete = hasPermission("expedition-groups.delete");

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ExpeditionGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExpeditionGroup | null>(
    null
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ExpeditionGroup | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getExpeditionGroups();
      setGroups(res.data);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal memuat grup ekspedisi."));
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    if (!authLoading && !canView) {
      router.replace("/dashboard");
    }
  }, [authLoading, canView, router]);

  useEffect(() => {
    if (!authLoading && canView) {
      void load();
    }
  }, [authLoading, canView, load]);

  const openCreate = () => {
    setEditingGroup(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setFormOpen(true);
  };

  const openEdit = (group: ExpeditionGroup) => {
    setEditingGroup(group);
    setForm(toForm(group));
    setSlugTouched(true);
    setFormOpen(true);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nama grup wajib diisi.");
      return;
    }
    const slug = slugify(form.slug);
    if (!slug) {
      toast.error("Slug wajib diisi (huruf kecil/angka/underscore).");
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload({ ...form, slug });
      if (editingGroup) {
        await updateExpeditionGroup(editingGroup.id, payload);
        toast.success("Grup ekspedisi berhasil diupdate.");
      } else {
        await createExpeditionGroup(payload);
        toast.success("Grup ekspedisi berhasil dibuat.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menyimpan grup ekspedisi."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExpeditionGroup(deleteTarget.id);
      toast.success("Grup ekspedisi berhasil dihapus.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menghapus grup ekspedisi."));
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDefaultExpeditionGroups();
      toast.success(
        "Grup ekspedisi dan penetapan vendor dikembalikan ke default."
      );
      setResetOpen(false);
      await load();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Gagal mengembalikan ke pengaturan default.")
      );
    } finally {
      setResetting(false);
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

  if (!canView) {
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
              { label: "Pengaturan Ekspedisi", href: "/dashboard/expedition/vendor-settings" },
              { label: "Grup Ekspedisi" },
            ]}
            icon={Layers}
            title="Grup Ekspedisi"
            description="Kelompokkan vendor ke dalam grup (Reguler & COD, Cargo, dst) beserta estimasi pengiriman generik per grup — dipakai untuk tab pilihan layanan saat kirim paket."
            action={
              canCreate || canUpdate ? (
                <div className="flex items-center gap-2">
                  {canUpdate && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 gap-2 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => setResetOpen(true)}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      Reset ke Default
                    </Button>
                  )}
                  {canCreate && (
                    <Button
                      type="button"
                      className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                      onClick={openCreate}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Tambah Grup
                    </Button>
                  )}
                </div>
              ) : undefined
            }
          />

          <SectionCard
            icon={Boxes}
            title="Daftar Grup"
            description={
              !loading && !error ? `${groups.length} grup` : undefined
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
            ) : groups.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada grup ekspedisi.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/60">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className={headCls}>Nama</TableHead>
                      <TableHead className={headCls}>Slug</TableHead>
                      <TableHead className={headCls}>Estimasi</TableHead>
                      <TableHead className={headCls}>Vendor</TableHead>
                      <TableHead className={`${headCls} text-right`}>
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow
                        key={group.id}
                        className="border-slate-100 hover:bg-slate-50/60"
                      >
                        <TableCell className="py-4 font-medium text-slate-900">
                          {group.name}
                          {group.description && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {group.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                            {group.slug}
                          </code>
                        </TableCell>
                        <TableCell className="py-4 text-xs text-slate-600">
                          <div>Kota: {group.estimasi_dalam_kota ?? "—"}</div>
                          <div>Pulau: {group.estimasi_dalam_pulau ?? "—"}</div>
                          <div>
                            Luar pulau: {group.estimasi_luar_pulau ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Truck className="h-3.5 w-3.5 text-slate-400" />
                            {group.vendor_settings_count} vendor
                          </div>
                          {group.vendors.length > 0 && (
                            <div className="mt-1 flex max-w-[220px] flex-wrap gap-1">
                              {group.vendors.map((v) => (
                                <span
                                  key={v}
                                  className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700"
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {canUpdate && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5 rounded-lg border-slate-200"
                                onClick={() => openEdit(group)}
                              >
                                <Edit className="h-3.5 w-3.5" aria-hidden />
                                Edit
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
                                onClick={() => setDeleteTarget(group)}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Hapus
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          {!canUpdate && !canCreate && (
            <p className="text-sm text-slate-500">
              Izin <span className="font-mono">expedition-groups.create</span>{" "}
              / <span className="font-mono">expedition-groups.update</span>{" "}
              diperlukan untuk mengubah grup.
            </p>
          )}
        </div>

        {/* Form tambah/edit */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-100 sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Layers className="h-5 w-5" aria-hidden />
                </span>
                <div className="text-left">
                  <DialogTitle>
                    {editingGroup ? "Edit Grup Ekspedisi" : "Tambah Grup Ekspedisi"}
                  </DialogTitle>
                  <DialogDescription>
                    Nama tampil di tab &quot;Pilihan Layanan&quot;; estimasi
                    hanya info umum, bukan pengganti ETD per-rute dari hasil
                    cek ongkir.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eg-name" className={labelCls}>
                  Nama <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="eg-name"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Contoh: Reguler & COD"
                  className={fieldCls}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eg-slug" className={labelCls}>
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="eg-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((prev) => ({
                      ...prev,
                      slug: slugify(e.target.value),
                    }));
                  }}
                  placeholder="reguler_cod"
                  className={`${fieldCls} font-mono`}
                />
                <p className="text-xs text-slate-400">
                  Huruf kecil/angka/underscore saja, harus unik. Kunci stabil
                  yang dipakai tab layanan — ubah dengan hati-hati kalau grup
                  sudah dipakai.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="eg-kota" className={labelCls}>
                    Est. Dalam Kota
                  </Label>
                  <Input
                    id="eg-kota"
                    value={form.estimasi_dalam_kota}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        estimasi_dalam_kota: e.target.value,
                      }))
                    }
                    placeholder="1-3 hari"
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eg-pulau" className={labelCls}>
                    Est. Dalam Pulau
                  </Label>
                  <Input
                    id="eg-pulau"
                    value={form.estimasi_dalam_pulau}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        estimasi_dalam_pulau: e.target.value,
                      }))
                    }
                    placeholder="3-5 hari"
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eg-luar" className={labelCls}>
                    Est. Luar Pulau
                  </Label>
                  <Input
                    id="eg-luar"
                    value={form.estimasi_luar_pulau}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        estimasi_luar_pulau: e.target.value,
                      }))
                    }
                    placeholder="4-7 hari"
                    className={fieldCls}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Ketiganya opsional, teks bebas — boleh dikosongkan kalau tidak
                relevan untuk grup ini (mis. grup instan cuma relevan dalam
                kota).
              </p>

              <div className="space-y-2">
                <Label htmlFor="eg-desc" className={labelCls}>
                  Deskripsi
                </Label>
                <Textarea
                  id="eg-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Catatan opsional untuk admin"
                  rows={2}
                  className="resize-y rounded-lg border-slate-200"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg border-slate-200"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingGroup ? "Simpan Perubahan" : "Buat Grup"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Konfirmasi hapus */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent className="rounded-2xl border-slate-100">
            <AlertDialogHeader className="items-center text-center sm:text-center">
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-7 w-7" aria-hidden />
              </span>
              <AlertDialogTitle>Hapus Grup Ekspedisi</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menghapus grup &quot;{deleteTarget?.name}&quot;?
                {deleteTarget && deleteTarget.vendor_settings_count > 0 && (
                  <>
                    {" "}
                    {deleteTarget.vendor_settings_count} vendor di grup ini
                    akan jadi tanpa grup (bukan otomatis dipindah ke grup
                    lain).
                  </>
                )}{" "}
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogCancel className="h-10 rounded-lg border-slate-200">
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="h-10 rounded-lg bg-rose-600 hover:bg-rose-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menghapus…
                  </>
                ) : (
                  "Hapus"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Konfirmasi reset ke default */}
        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <AlertDialogContent className="rounded-2xl border-slate-100">
            <AlertDialogHeader className="items-center text-center sm:text-center">
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <RotateCcw className="h-7 w-7" aria-hidden />
              </span>
              <AlertDialogTitle>Reset ke Pengaturan Default</AlertDialogTitle>
              <AlertDialogDescription>
                Grup &quot;Reguler &amp; COD&quot; dan &quot;Cargo&quot; akan
                dikembalikan ke nama, slug, dan estimasi pengiriman default
                (membuat ulang kalau sebelumnya terhapus), dan semua vendor
                dikembalikan ke grup default masing-masing — J&amp;T Cargo ke
                Cargo, vendor lainnya ke Reguler &amp; COD. Perubahan manual
                pada kedua grup ini dan penetapan vendor akan ditimpa. Grup
                custom lain yang pernah dibuat tidak dihapus. Tindakan ini
                tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogCancel className="h-10 rounded-lg border-slate-200">
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void handleReset()}
                disabled={resetting}
                className="h-10 rounded-lg bg-amber-600 hover:bg-amber-700"
              >
                {resetting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mereset…
                  </>
                ) : (
                  "Reset ke Default"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

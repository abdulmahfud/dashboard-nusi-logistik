"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
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
  getPostCategories,
  createPostCategory,
  updatePostCategory,
  deletePostCategory,
} from "@/lib/apiClient";
import type { PostCategory } from "@/types/post";

const headCls = "h-11 text-xs font-semibold text-slate-500";
const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-700";

/** Envelope validasi di endpoint ini: field -> pesan error langsung di root body, bukan dibungkus `errors`. */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { message?: string; [field: string]: unknown }
      | undefined;
    if (!data) return fallback;
    if (typeof data.message === "string") return data.message;
    const firstField = Object.values(data).find(
      (v): v is string[] => Array.isArray(v) && typeof v[0] === "string"
    );
    if (firstField) return firstField[0];
    return fallback;
  }
  return fallback;
}

export default function BlogCategoriesPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canView = hasPermission("categories.index");
  const canCreate = hasPermission("categories.store");
  const canUpdate = hasPermission("categories.update");
  const canDelete = hasPermission("categories.destroy");

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PostCategory | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PostCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPostCategories({ search: search || undefined });
      setCategories(res.data.data);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal memuat kategori."));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [canView, search]);

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
    setEditing(null);
    setName("");
    setFormOpen(true);
  };

  const openEdit = (category: PostCategory) => {
    setEditing(category);
    setName(category.name);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updatePostCategory(editing.id, name.trim());
        toast.success("Kategori berhasil diupdate.");
      } else {
        await createPostCategory(name.trim());
        toast.success("Kategori berhasil dibuat.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menyimpan kategori."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePostCategory(deleteTarget.id);
      toast.success("Kategori berhasil dihapus.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menghapus kategori."));
    } finally {
      setDeleting(false);
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
              { label: "Artikel Blog", href: "/dashboard/blog/artikel" },
              { label: "Kategori Blog" },
            ]}
            icon={Tag}
            title="Kategori Blog"
            description="Kelola kategori artikel blog — dipakai saat membuat/edit artikel."
            action={
              canCreate ? (
                <Button
                  type="button"
                  className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  onClick={openCreate}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Tambah Kategori
                </Button>
              ) : undefined
            }
          />

          <SectionCard
            icon={Tag}
            title="Daftar Kategori"
            description={
              !loading && !error ? `${categories.length} kategori` : undefined
            }
            action={
              <div className="flex items-center gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kategori..."
                  className={`${fieldCls} w-48`}
                />
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
              </div>
            }
          >
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada kategori.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/60">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className={headCls}>Nama</TableHead>
                      <TableHead className={headCls}>Slug</TableHead>
                      <TableHead className={`${headCls} text-right`}>
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow
                        key={category.id}
                        className="border-slate-100 hover:bg-slate-50/60"
                      >
                        <TableCell className="py-4 font-medium text-slate-900">
                          {category.name}
                        </TableCell>
                        <TableCell className="py-4">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                            {category.slug}
                          </code>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {canUpdate && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5 rounded-lg border-slate-200"
                                onClick={() => openEdit(category)}
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
                                onClick={() => setDeleteTarget(category)}
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
        </div>

        {/* Form tambah/edit */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Tag className="h-5 w-5" aria-hidden />
                </span>
                <div className="text-left">
                  <DialogTitle>
                    {editing ? "Edit Kategori" : "Tambah Kategori"}
                  </DialogTitle>
                  <DialogDescription>
                    Slug dibuat otomatis dari nama kategori.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name" className={labelCls}>
                  Nama <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Tips Pengiriman"
                  className={fieldCls}
                  autoFocus
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
                  {editing ? "Simpan Perubahan" : "Buat Kategori"}
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
              <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menghapus kategori &quot;{deleteTarget?.name}
                &quot;? Artikel yang masih memakai kategori ini akan ikut
                terhapus (relasi cascade). Tindakan ini tidak dapat
                dibatalkan.
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
      </SidebarInset>
    </SidebarProvider>
  );
}

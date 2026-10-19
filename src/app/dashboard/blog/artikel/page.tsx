"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  Edit,
  ImagePlus,
  Loader2,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
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
import { Textarea } from "@/components/ui/textarea";
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
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { useAuth } from "@/context/AuthContext";
import {
  getBlogPosts,
  getAllPostCategories,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "@/lib/apiClient";
import { formatBytes } from "@/lib/support-ticket-upload";
import { formatDateIdLong } from "@/lib/date";
import type { BlogPost, PostCategory } from "@/types/post";

const headCls = "h-11 text-xs font-semibold text-slate-500";
const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-700";

const IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png";
const IMAGE_MAX_BYTES = 2000 * 1024; // 2MB, sama dengan validasi BE

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

function validateImageFile(file: File): string | null {
  if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
    return "Gunakan JPEG atau PNG.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return `Maks. ${formatBytes(IMAGE_MAX_BYTES)} (ini ${formatBytes(file.size)}).`;
  }
  return null;
}

export default function BlogPostsPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const canView = hasPermission("posts.index");
  const canCreate = hasPermission("posts.store");
  const canUpdate = hasPermission("posts.update");
  const canDelete = hasPermission("posts.destroy");

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [categories, setCategories] = useState<PostCategory[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getBlogPosts({
        search: search || undefined,
        page,
        per_page: perPage,
      });
      setPosts(res.data.data);
      setLastPage(res.data.last_page);
      setTotal(res.data.total);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal memuat artikel."));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [canView, search, page, perPage]);

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

  useEffect(() => {
    if (!authLoading && canView) {
      getAllPostCategories()
        .then((res) => setCategories(res.data))
        .catch(() => setCategories([]));
    }
  }, [authLoading, canView]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const resetForm = () => {
    setTitle("");
    setCategoryId("");
    setContent("");
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setTitle(post.title);
    setCategoryId(String(post.category_id));
    setContent(post.content);
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFormOpen(true);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      return;
    }
    const err = validateImageFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul wajib diisi.");
      return;
    }
    if (!categoryId) {
      toast.error("Pilih kategori.");
      return;
    }
    if (!content.trim()) {
      toast.error("Isi artikel wajib diisi.");
      return;
    }
    if (!editing && !imageFile) {
      toast.error("Gambar wajib diunggah.");
      return;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("category_id", categoryId);
    fd.append("content", content);
    if (imageFile) fd.append("image", imageFile);

    setSaving(true);
    try {
      if (editing) {
        await updateBlogPost(editing.id, fd);
        toast.success("Artikel berhasil diupdate.");
      } else {
        await createBlogPost(fd);
        toast.success("Artikel berhasil dibuat.");
      }
      setFormOpen(false);
      resetForm();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menyimpan artikel."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBlogPost(deleteTarget.id);
      toast.success("Artikel berhasil dihapus.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menghapus artikel."));
    } finally {
      setDeleting(false);
    }
  };

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories]
  );

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
              { label: "Artikel Blog" },
            ]}
            icon={Newspaper}
            title="Artikel Blog"
            description="Kelola artikel yang tampil di halaman Blog publik."
            action={
              canCreate ? (
                <Button
                  type="button"
                  className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  onClick={openCreate}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Tambah Artikel
                </Button>
              ) : undefined
            }
          />

          <SectionCard
            icon={Newspaper}
            title="Daftar Artikel"
            description={!loading && !error ? `${total} artikel` : undefined}
            action={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Cari judul artikel..."
                    className={`${fieldCls} w-56 pl-9`}
                  />
                </div>
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
            ) : posts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Belum ada artikel.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader className="bg-slate-50/60">
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className={headCls}>Gambar</TableHead>
                        <TableHead className={headCls}>Judul</TableHead>
                        <TableHead className={headCls}>Kategori</TableHead>
                        <TableHead className={headCls}>Penulis</TableHead>
                        <TableHead className={headCls}>Dibuat</TableHead>
                        <TableHead className={`${headCls} text-right`}>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow
                          key={post.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-3">
                            {post.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element -- domain gambar dinamis, tidak dikonfigurasi di next.config
                              <img
                                src={post.image_url}
                                alt={post.title}
                                className="h-12 w-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                <Newspaper className="h-5 w-5" aria-hidden />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs py-4 font-medium text-slate-900">
                            <span className="line-clamp-2">{post.title}</span>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-600">
                            {post.category?.name ?? "—"}
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-600">
                            {post.user?.name ?? "—"}
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-600">
                            {post.created_at
                              ? formatDateIdLong(post.created_at)
                              : "—"}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {canUpdate && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-9 gap-1.5 rounded-lg border-slate-200"
                                  onClick={() => openEdit(post)}
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
                                  onClick={() => setDeleteTarget(post)}
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

        {/* Form tambah/edit */}
        <Dialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-100 sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Newspaper className="h-5 w-5" aria-hidden />
                </span>
                <div className="text-left">
                  <DialogTitle>
                    {editing ? "Edit Artikel" : "Tambah Artikel"}
                  </DialogTitle>
                  <DialogDescription>
                    Slug dibuat otomatis dari judul.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-title" className={labelCls}>
                  Judul <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul artikel"
                  className={fieldCls}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-category" className={labelCls}>
                  Kategori <span className="text-red-500">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger
                    id="post-category"
                    className={fieldCls}
                  >
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoryOptions.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Belum ada kategori — buat kategori dulu di halaman
                    Kategori Blog.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-content" className={labelCls}>
                  Isi Artikel <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis isi artikel di sini..."
                  rows={8}
                  className="resize-y rounded-lg border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-image" className={labelCls}>
                  Gambar{" "}
                  {editing ? (
                    <span className="font-normal text-slate-400">
                      (opsional — biarkan kosong untuk pakai gambar lama)
                    </span>
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
                  <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element -- object URL lokal
                      <img
                        src={imagePreview}
                        alt=""
                        className="h-16 w-24 shrink-0 rounded-lg object-cover"
                      />
                    ) : editing?.image_url ? (
                      <Image
                        src={editing.image_url}
                        alt=""
                        width={96}
                        height={64}
                        className="h-16 w-24 shrink-0 rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <ImagePlus className="h-5 w-5" aria-hidden />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {imageFile
                          ? imageFile.name
                          : "Seret file ke sini atau klik untuk memilih"}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        JPEG/PNG · maks. {formatBytes(IMAGE_MAX_BYTES)}
                      </p>
                    </div>
                    <Input
                      id="post-image"
                      type="file"
                      accept={IMAGE_ACCEPT}
                      className="sr-only"
                      onChange={(e) => {
                        handleFileChange(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() =>
                        document.getElementById("post-image")?.click()
                      }
                    >
                      Pilih gambar
                    </Button>
                  </div>
                </div>
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
                  {editing ? "Simpan Perubahan" : "Buat Artikel"}
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
              <AlertDialogTitle>Hapus Artikel</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menghapus artikel &quot;{deleteTarget?.title}
                &quot;? Tindakan ini tidak dapat dibatalkan.
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

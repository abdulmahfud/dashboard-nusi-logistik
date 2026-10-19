"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  Edit,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { getBlogPosts, deleteBlogPost } from "@/lib/apiClient";
import { formatDateIdLong } from "@/lib/date";
import type { BlogPost } from "@/types/post";

const headCls = "h-11 text-xs font-semibold text-slate-500";
const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";

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
                  asChild
                  type="button"
                  className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  <Link href="/dashboard/blog/artikel/baru">
                    <Plus className="h-4 w-4" aria-hidden />
                    Tambah Artikel
                  </Link>
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
                                  asChild
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-9 gap-1.5 rounded-lg border-slate-200"
                                >
                                  <Link
                                    href={`/dashboard/blog/artikel/${post.id}`}
                                  >
                                    <Edit
                                      className="h-3.5 w-3.5"
                                      aria-hidden
                                    />
                                    Edit
                                  </Link>
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

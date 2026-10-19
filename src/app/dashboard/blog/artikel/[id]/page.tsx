"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ImagePlus, Loader2, Newspaper, Save } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import {
  getAllPostCategories,
  getBlogPost,
  updateBlogPost,
} from "@/lib/apiClient";
import { formatBytes } from "@/lib/support-ticket-upload";
import RichTextEditor from "@/components/Blog/RichTextEditor";
import type { PostCategory } from "@/types/post";

const fieldCls = "rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-700";

const IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png";
const IMAGE_MAX_BYTES = 2000 * 1024; // 2MB, sama dengan validasi BE

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

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const { hasPermission, loading: authLoading } = useAuth();
  const canUpdate = hasPermission("posts.update");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !canUpdate) {
      router.replace("/dashboard/blog/artikel");
    }
  }, [authLoading, canUpdate, router]);

  useEffect(() => {
    if (authLoading || !canUpdate || !postId) return;
    setLoading(true);
    Promise.all([getAllPostCategories(), getBlogPost(postId)])
      .then(([catRes, postRes]) => {
        setCategories(catRes.data);
        if (!postRes.data) {
          setNotFound(true);
          return;
        }
        const post = postRes.data;
        setTitle(post.title);
        setCategoryId(String(post.category_id));
        setContent(post.content);
        setCurrentImageUrl(post.image_url);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [authLoading, canUpdate, postId]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
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
    const plainContent = content.replace(/<[^>]*>/g, "").trim();
    if (!plainContent) {
      toast.error("Isi artikel wajib diisi.");
      return;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("category_id", categoryId);
    fd.append("content", content);
    if (imageFile) fd.append("image", imageFile);

    setSaving(true);
    try {
      await updateBlogPost(postId, fd);
      toast.success("Artikel berhasil diupdate.");
      router.push("/dashboard/blog/artikel");
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menyimpan artikel."));
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories]
  );

  if (authLoading || loading) {
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

  if (notFound) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <Newspaper className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">Artikel tidak ditemukan.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/blog/artikel")}
            >
              Kembali ke Daftar Artikel
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
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

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6"
        >
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Artikel Blog", href: "/dashboard/blog/artikel" },
              { label: "Edit Artikel" },
            ]}
            icon={Newspaper}
            title="Edit Artikel"
            description="Ubah judul, kategori, gambar sampul, atau isi artikel."
          />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="min-w-0 space-y-4 lg:col-span-8">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul artikel"
                className={`${fieldCls} h-14 text-xl font-semibold`}
                autoFocus
              />

              <RichTextEditor value={content} onChange={setContent} />
            </div>

            <div className="min-w-0 space-y-6 lg:col-span-4">
              <SectionCard icon={Save} title="Simpan">
                <Button
                  type="submit"
                  className="h-11 w-full gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </SectionCard>

              <SectionCard icon={ImagePlus} title="Kategori">
                <div className="space-y-2">
                  <Label htmlFor="post-category" className={labelCls}>
                    Kategori <span className="text-red-500">*</span>
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="post-category" className={fieldCls}>
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
                </div>
              </SectionCard>

              <SectionCard icon={ImagePlus} title="Gambar Sampul">
                <div className="space-y-2">
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
                    <div className="flex flex-col items-center gap-2 text-center">
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element -- object URL lokal
                        <img
                          src={imagePreview}
                          alt=""
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      ) : currentImageUrl ? (
                        <Image
                          src={currentImageUrl}
                          alt=""
                          width={240}
                          height={128}
                          unoptimized
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <ImagePlus className="h-5 w-5" aria-hidden />
                        </div>
                      )}
                      <p className="text-sm font-medium text-slate-800">
                        {imageFile
                          ? imageFile.name
                          : "Ganti gambar (opsional)"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        JPEG/PNG · maks. {formatBytes(IMAGE_MAX_BYTES)}
                      </p>
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
                        className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() =>
                          document.getElementById("post-image")?.click()
                        }
                      >
                        Pilih gambar
                      </Button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </form>
      </SidebarInset>
    </SidebarProvider>
  );
}

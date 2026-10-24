"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Close as PopoverClose } from "@radix-ui/react-popover";
import { Loader2, Megaphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getHomePosts } from "@/lib/apiClient";
import type { BlogPost } from "@/types/post";
import { cn } from "@/lib/utils";

const BLOG_BASE_URL = "https://bhisakirim.com/blog";
const MAX_POSTS = 10;
const ALL_TAB = "semua";

function formatPostDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
}

/** Preview teks polos dari content HTML (hasil editor WYSIWYG di admin). */
function plainTextPreview(html: string, maxLength = 160): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/**
 * Tombol "Update BhisaKirim" di header beranda (kiri filter tanggal) - klik
 * buka popover (menempel di bawah tombol, bukan dialog modal full layar)
 * berisi sampai 10 artikel blog terbaru, model tampilan feed ala "Seputar
 * KiriminAja": ikon + judul + tanggal, cuplikan isi, gambar, link "Lihat
 * Detail", dengan tab kategori di atas. Data diambil dari GET
 * /public/posts_home (publik, tanpa permission posts.index) supaya semua
 * role termasuk customer biasa bisa lihat, bukan cuma admin blog. Fetch
 * baru jalan saat popover dibuka pertama kali, bukan saat beranda dimuat.
 */
export function UpdateBhisaKirimButton() {
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [activeTab, setActiveTab] = useState(ALL_TAB);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !fetched) {
      setLoading(true);
      getHomePosts()
        .then((res) => setPosts((res.data ?? []).slice(0, MAX_POSTS)))
        .catch((err) => {
          console.error("Failed to fetch home posts:", err);
          setPosts([]);
        })
        .finally(() => {
          setLoading(false);
          setFetched(true);
        });
    }
  };

  // Tab kategori diturunkan dari kategori yang benar-benar ada di antara
  // post yang terambil - bukan daftar tetap, supaya selalu sesuai dengan
  // kategori yang sebenarnya dipakai di CMS blog.
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    posts.forEach((post) => {
      if (post.category) seen.set(post.category.slug, post.category.name);
    });
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeTab === ALL_TAB) return posts;
    return posts.filter((post) => post.category?.slug === activeTab);
  }, [posts, activeTab]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        handleOpenChange(next);
        if (next) setActiveTab(ALL_TAB);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 rounded-lg border-slate-200 bg-white font-semibold text-slate-900 hover:bg-slate-50"
        >
          <Megaphone className="h-4 w-4 text-blue-600" aria-hidden />
          Update BhisaKirim
        </Button>
      </PopoverTrigger>
      {/* w-[calc(100vw-2rem)]: di mobile lebar menyesuaikan layar (sisa
          margin 1rem tiap sisi) dibatasi max-w-[420px] di layar lebar -
          Radix Popover sendiri sudah auto-geser kalau mepet tepi viewport. */}
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] max-w-[420px] rounded-2xl border-slate-100 p-0 shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-base font-semibold text-slate-900">
            Seputar BhisaKirim
          </p>
          <PopoverClose
            aria-label="Tutup"
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </PopoverClose>
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-4 overflow-x-auto border-b border-slate-100 px-4">
            <button
              type="button"
              onClick={() => setActiveTab(ALL_TAB)}
              className={cn(
                "shrink-0 border-b-2 py-2.5 text-sm font-medium transition-colors",
                activeTab === ALL_TAB
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Semua
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => setActiveTab(category.slug)}
                className={cn(
                  "shrink-0 border-b-2 py-2.5 text-sm font-medium transition-colors",
                  activeTab === category.slug
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat...
            </div>
          ) : filteredPosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Belum ada artikel terbaru.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 px-4 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                    <Megaphone className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {post.title}
                      </h3>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatPostDate(post.created_at)}
                      </span>
                    </div>

                    <p className="mt-1.5 line-clamp-3 text-sm text-slate-600">
                      {plainTextPreview(post.content)}
                    </p>

                    {post.image_url && (
                      <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={post.image_url}
                          alt={post.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    )}

                    <a
                      href={`${BLOG_BASE_URL}/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 inline-block text-sm font-medium text-blue-600 hover:underline"
                    >
                      Lihat Detail
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

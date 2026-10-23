"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Newspaper } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getHomePosts } from "@/lib/apiClient";
import type { BlogPost } from "@/types/post";

const BLOG_BASE_URL = "https://bhisakirim.com/blog";
const MAX_POSTS = 10;

/**
 * Tombol "Update BhisaKirim" di header beranda (kiri filter tanggal) - klik
 * buka popover (menempel di bawah tombol, bukan dialog modal full layar)
 * berisi sampai 10 artikel blog terbaru (thumbnail + judul). Data diambil
 * dari GET /public/posts_home (publik, tanpa permission posts.index) supaya
 * semua role termasuk customer biasa bisa lihat, bukan cuma admin blog.
 * Fetch baru jalan saat popover dibuka pertama kali, bukan saat beranda
 * dimuat, supaya tidak nambah request kalau tombolnya tidak pernah dipencet.
 */
export function UpdateBhisaKirimButton() {
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

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

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 rounded-lg border-slate-200 bg-white font-semibold text-slate-900 hover:bg-slate-50"
        >
          <Newspaper className="h-4 w-4 text-blue-600" aria-hidden />
          Update BhisaKirim
        </Button>
      </PopoverTrigger>
      {/* w-[calc(100vw-2rem)]: di mobile lebar menyesuaikan layar (sisa
          margin 1rem tiap sisi) dibatasi max-w-[380px] di layar lebar -
          Radix Popover sendiri sudah auto-geser kalau mepet tepi viewport. */}
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] max-w-[380px] rounded-2xl border-slate-100 p-0 shadow-lg"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            Update BhisaKirim
          </p>
          <p className="text-xs text-slate-500">
            Artikel &amp; informasi terbaru dari Bhisakirim.
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat...
            </div>
          ) : posts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Belum ada artikel terbaru.
            </p>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <a
                  key={post.id}
                  href={`${BLOG_BASE_URL}/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-2 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {post.image_url ? (
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Newspaper className="h-5 w-5" aria-hidden />
                      </div>
                    )}
                  </div>
                  {/* line-clamp-2: judul panjang dipotong rapi jadi 2 baris,
                      bukan mendorong tinggi baris jadi tidak rata. */}
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-blue-600">
                    {post.title}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

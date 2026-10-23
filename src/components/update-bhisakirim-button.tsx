"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Newspaper } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getHomePosts } from "@/lib/apiClient";
import type { BlogPost } from "@/types/post";

const BLOG_BASE_URL = "https://bhisakirim.com/blog";

/**
 * Tombol "Update BhisaKirim" di header beranda (kiri filter tanggal) - klik
 * buka dialog berisi artikel blog terbaru (thumbnail + judul). Data diambil
 * dari GET /public/posts_home (publik, tanpa permission posts.index) supaya
 * semua role termasuk customer biasa bisa lihat, bukan cuma admin blog.
 * Fetch baru jalan saat dialog dibuka pertama kali, bukan saat beranda
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
        .then((res) => setPosts(res.data ?? []))
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 rounded-lg border-slate-200 bg-white font-semibold text-slate-900 hover:bg-slate-50"
        >
          <Newspaper className="h-4 w-4 text-blue-600" aria-hidden />
          Update BhisaKirim
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto rounded-2xl border-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update BhisaKirim</DialogTitle>
          <DialogDescription>
            Artikel &amp; informasi terbaru dari Bhisakirim.
          </DialogDescription>
        </DialogHeader>

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
          <div className="space-y-3">
            {posts.map((post) => (
              <a
                key={post.id}
                href={`${BLOG_BASE_URL}/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
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
                      <Newspaper className="h-6 w-6" aria-hidden />
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
      </DialogContent>
    </Dialog>
  );
}

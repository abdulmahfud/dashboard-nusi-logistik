"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Newspaper } from "lucide-react";

import { SectionCard } from "@/components/redesign/section-card";
import { getHomePosts } from "@/lib/apiClient";
import type { BlogPost } from "@/types/post";

const BLOG_BASE_URL = "https://bhisakirim.com/blog";

export function SectionCardsUpdates() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await getHomePosts();
        if (!cancelled) setPosts(res.data ?? []);
      } catch (err) {
        console.error("Failed to fetch home posts:", err);
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SectionCard
      icon={Newspaper}
      title="Update BhisaKirim"
      description="Artikel & informasi terbaru"
      action={
        <a
          href={BLOG_BASE_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
        >
          Lihat Semua
        </a>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="aspect-video w-full rounded-xl bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Belum ada artikel terbaru.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <a
              key={post.id}
              href={`${BLOG_BASE_URL}/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-xl border border-slate-100 transition-colors hover:border-blue-200"
            >
              <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-100">
                {post.image_url ? (
                  <Image
                    src={post.image_url}
                    alt={post.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <Newspaper className="h-8 w-8" aria-hidden />
                  </div>
                )}
              </div>
              {/* line-clamp-2: judul panjang dipotong rapi jadi 2 baris, bukan
                  mendorong tinggi kartu jadi tidak rata dengan kartu lain. */}
              <p className="line-clamp-2 p-3 text-sm font-medium leading-snug text-slate-800 group-hover:text-blue-600">
                {post.title}
              </p>
            </a>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

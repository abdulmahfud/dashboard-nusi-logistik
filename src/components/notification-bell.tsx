"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Close as PopoverClose } from "@radix-ui/react-popover";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/apiClient";
import { formatNotificationDateTime, getNotificationIcon } from "@/lib/notificationUi";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification";

const POLL_INTERVAL_MS = 45000;
const MAX_ITEMS = 20;

/**
 * Lonceng notifikasi di header - popover (bukan dialog), meniru struktur
 * UpdateBhisaKirimButton: fetch lazy saat dibuka pertama kali. Badge unread
 * di-polling independen dari status buka/tutup popover (pola setInterval
 * yang sama seperti PaymentFlow.tsx). Tidak permission-gated - notifikasi
 * selalu milik user yang login, BE sudah scope ke situ.
 *
 * Adapter: setiap jenis notifikasi baru di BE (app/Notifications/*) cukup
 * mematuhi kontrak {title, message, icon, url} - komponen ini tidak pernah
 * perlu tahu jenis notifikasinya apa.
 */
export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res.data?.count ?? 0);
    } catch {
      // badge cuma best-effort - diamkan kalau satu kali polling gagal
    }
  }, []);

  useEffect(() => {
    void loadUnreadCount();
    const interval = setInterval(() => void loadUnreadCount(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ per_page: MAX_ITEMS });
      setItems(res.data?.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !fetched) {
      void loadNotifications();
    }
  };

  const handleItemClick = async (n: AppNotification) => {
    if (!n.read_at) {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read_at: now } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationAsRead(n.id);
      } catch {
        void loadUnreadCount();
      }
    }
    setOpen(false);
    if (n.url) router.push(n.url);
  };

  const handleMarkAllAsRead = async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((item) => ({ ...item, read_at: item.read_at ?? now })));
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead();
    } catch {
      void loadUnreadCount();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-11 w-11 shrink-0 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] max-w-[380px] rounded-2xl border-slate-100 p-0 shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-base font-semibold text-slate-900">Notifikasi</p>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Tandai semua dibaca
              </button>
            )}
            <PopoverClose
              aria-label="Tutup"
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </PopoverClose>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat...
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Belum ada notifikasi.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => {
                const Icon = getNotificationIcon(n.icon);
                const unread = !n.read_at;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void handleItemClick(n)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                        unread && "bg-blue-50/50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          unread ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                          {unread && (
                            <span
                              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                              aria-hidden
                            />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
                          {n.message}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatNotificationDateTime(n.created_at)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { getOrders } from "@/lib/apiClient";
import type { Order } from "@/types/laporanPengiriman";

/**
 * Satu fetch GET /admin/list-orders untuk semua kartu ringkasan di beranda
 * (Ringkasan Pengiriman, Ringkasan Status Pengiriman, Ringkasan Paket
 * Reguler, Ringkasan Paket COD) - dipakai bareng dari dashboard/page.tsx
 * supaya semua kartu menghitung dari order mentah yang sama persis (sama
 * seperti dashboard/laporan/laporan-pengiriman), bukan masing-masing fetch
 * sendiri-sendiri dari endpoint statistik yang bisa saja beda definisi.
 */
export function useDashboardOrders(dateRange: DateRange | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const startDate = dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined;
        const endDate = dateRange?.to
          ? format(dateRange.to, "yyyy-MM-dd")
          : startDate;
        const res = await getOrders(startDate, endDate);
        if (!cancelled) setOrders(res.data ?? []);
      } catch (err) {
        console.error("Failed to fetch dashboard orders:", err);
        if (!cancelled) setError("Gagal memuat data pengiriman.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  return { orders, loading, error };
}

// Tipe untuk Laporan Aktivitas Pengiriman per Akun
// Lihat docs/be-fe/laporan-aktivitas-pengiriman.md

export interface ShippingReportVendorBreakdown {
  vendor: string;
  total_shipments: number;
  total_ongkir: number;
}

export interface ShippingReportTotals {
  total_shipments: number;
  total_ongkir: number;
}

/** Hanya muncul untuk account_type === "corporate". */
export interface ShippingReportCredit {
  credit_limit: number;
  max_outstanding: number | null;
  /** Piutang berjalan saat ini (bukan cuma periode terpilih). */
  outstanding_balance: number;
  /** Khusus pemakaian kredit dalam periode start_date–end_date yang dipilih. */
  credit_used_this_period: number;
}

export interface ShippingReportUser {
  id: number;
  name: string;
  account_type: "personal" | "corporate" | "agen";
}

export interface ShippingActivityReport {
  user: ShippingReportUser;
  period: { start_date: string; end_date: string };
  by_vendor: ShippingReportVendorBreakdown[];
  totals: ShippingReportTotals;
  credit?: ShippingReportCredit;
}

export interface ShippingActivityReportResponse {
  status: string;
  message?: string;
  data: ShippingActivityReport;
}

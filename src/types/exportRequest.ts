/** Lihat docs/be-fe/export-laporan-pengiriman.md */
export type ExportType =
  | "shipping-report"
  | "shipping-activity"
  | "shipping-summary"
  | "cancel-orders"
  | "bank-accounts"
  | "users"
  | "support-tickets"
  | "feedbacks"
  | "kerja-sama-invoices"
  | "withdraws"
  | "kerja-sama-ledger"
  | "transactions"
  | "wallet-history";

export type ExportStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "expired";

export interface ExportRequestItem {
  id: number;
  user_id: number;
  type: ExportType | string;
  type_label: string;
  filters: { start_date?: string | null; end_date?: string | null } | null;
  status: ExportStatus;
  is_downloadable: boolean;
  file_name: string | null;
  file_size: number | null;
  total_rows: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExportPayload {
  type: ExportType;
  start_date?: string;
  end_date?: string;
  /** shipping-activity / shipping-summary (khusus yang boleh melihat semua akun): batasi ke satu akun. */
  user_id?: number;
  /** bank-accounts: pending/approved/rejected. support-tickets: awaiting_support/awaiting_customer/resolved/closed. kerja-sama-invoices: draft/issued/partially_paid/paid/overdue/void. withdraws: pending/approved/rejected. kerja-sama-ledger: pending/confirmed/invoiced/voided. transactions: pending/paid/expired/failed. wallet-history: pending/success/failed. */
  status?: string;
  /** Hanya untuk support-tickets: kode departemen. */
  department?: string;
  /** kerja-sama-ledger: charge/payment/adjustment/write_off. transactions: order/topup/cod_income. wallet-history: topup/payment/withdraw/cod_income. (bukan `type`) */
  transaction_type?: string;
  /** Hanya untuk wallet-history: kata pencarian (keterangan / nomor referensi), maks. 255. */
  search?: string;
  /** Hanya untuk transactions: wallet/cod/xendit. */
  payment_method?: string;
  /** Hanya untuk feedbacks: 1 sampai 5. */
  rating?: number;
  /** Hanya untuk users: nama role. */
  role?: string;
  /** Hanya untuk users: tipe akun customer. */
  account_type?: "personal" | "corporate" | "agen";
}

export interface ExportListQuery {
  type?: string;
  status?: ExportStatus;
  page?: number;
  per_page?: number;
}

export interface ExportListResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: ExportRequestItem[];
    last_page: number;
    per_page: number;
    total: number;
  };
}

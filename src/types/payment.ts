export interface PaymentCreateRequest {
  shipping_data: {
    vendor: string;
    detail: Record<string, unknown>[];
    [key: string]: unknown;
  };
  amount: number;
  payment_method?: "xendit" | "wallet";
}

export interface PaymentCreateResponse {
  success: boolean;
  message: string;
  data?: {
    payment_id: number;
    reference_no: string;
    invoice_id: string | null;
    invoice_url?: string | null;
    amount: number | string;
    expired_at?: string | null;
    status: "pending" | "paid" | string;
    payment_method: "wallet" | "xendit";
    requires_action: boolean;
    action_url: string | null;
    order_id?: number;
  };
  errors?: Record<string, unknown>;
}

export interface PaymentStatus {
  reference_no: string;
  invoice_id: string;
  amount: number;
  status: "pending" | "paid" | "expired" | "failed";
  payment_method?: string;
  payment_channel?: string;
  invoice_url?: string;
  paid_at?: string;
  expired_at?: string;
  created_at: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  message?: string;
  data?: PaymentStatus;
}

/** Query GET /admin/payments/history. Semua opsional, boleh digabung. */
export interface PaymentHistoryQuery {
  /** Cari di reference_no, external_id, invoice_id, payment_method, payment_channel. */
  search?: string;
  /** YYYY-MM-DD, inklusif (Asia/Jakarta). date_to < date_from → 422. */
  date_from?: string;
  date_to?: string;
  status?: "pending" | "paid" | "expired" | "failed";
  page?: number;
  per_page?: number;
}

export interface PaymentSummaryBucket {
  count: number;
  total_amount: number;
}

/**
 * Ringkasan pada response history. Dihitung dari search/date_from/date_to yang
 * aktif tetapi MENGABAIKAN filter `status` (breakdown semua status selalu lengkap).
 */
export interface PaymentHistorySummary {
  total: number;
  total_amount: number;
  by_status: Record<"pending" | "paid" | "expired" | "failed", PaymentSummaryBucket>;
  /** Hanya pembayaran berstatus paid, mis. WALLET, COD, BANK_TRANSFER, EWALLET, UNKNOWN. */
  by_payment_method?: Record<string, PaymentSummaryBucket>;
}

export interface PaymentHistoryResponse {
  success: boolean;
  message?: string;
  data?: PaymentStatus[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary?: PaymentHistorySummary;
}

export interface PaymentCancelResponse {
  success: boolean;
  message: string;
}

export interface PaymentFlow {
  step: "shipping" | "payment" | "processing" | "completed" | "failed";
  payment?: PaymentStatus;
  shippingData?: Record<string, unknown>;
}

export type PaymentAllQuery = {
  user_id?: number;
  status?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  reference_no?: string;
  page?: number;
  per_page?: number;
};

export interface PaymentAllItem {
  id?: number;
  reference_no?: string;
  invoice_id?: string | null;
  amount?: number | string;
  status?: string;
  payment_method?: string;
  payment_channel?: string | null;
  created_at?: string;
  paid_at?: string | null;
  expired_at?: string | null;
  user?: {
    id?: number;
    name?: string;
    email?: string;
  };
  [key: string]: unknown;
}

export interface PaymentAllResponse {
  success?: boolean;
  message?: string;
  data?: PaymentAllItem[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

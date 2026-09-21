export interface WalletTopupData {
  invoice_url: string;
  reference_no: string;
  payment_id: number;
  amount: number;
  expired_at: string;
  status: string;
}

export interface WalletTopupResponse {
  success: boolean;
  message: string;
  data: WalletTopupData;
}

/** GET /admin/wallet/summary — ringkasan bulanan (semua total_* dari transaksi berstatus success, positif). */
export interface WalletSummaryData {
  period: { month: string; from: string; to: string };
  /** Saldo saat ini (real-time), bukan saldo akhir bulan. */
  balance: number | string;
  total_topup: number | string;
  total_usage: number | string;
  total_withdraw: number | string;
  total_cod_income: number | string;
  transactions_count: number;
  /** Transaksi paling baru secara keseluruhan, tidak dibatasi bulan. */
  last_transaction_at: string | null;
}

export interface WalletSummaryResponse {
  success?: boolean;
  message?: string;
  data?: WalletSummaryData;
}

export interface WalletBalanceResponse {
  success?: boolean;
  message?: string;
  data?: {
    balance?: number | string;
  };
}

/** Item transaksi dompet — struktur mengikuti response API (boleh berubah). */
export interface WalletTransactionItem {
  id?: number;
  type?: string;
  amount?: number | string;
  /** Hanya terisi untuk transaksi baru yang mengubah saldo; selain itu `null`. */
  balance_before?: number | string | null;
  balance_after?: number | string | null;
  status?: string;
  description?: string;
  reference_no?: string;
  created_at?: string;
  updated_at?: string;
  /** Detail sumber transaksi (nomor referensi dkk). */
  source?: {
    reference_no?: string;
    [key: string]: unknown;
  } | null;
  payment?: {
    id?: number;
    reference_no?: string;
    status?: string;
    amount?: number | string;
  };
  user?: {
    id?: number;
    name?: string;
    email?: string;
  };
  [key: string]: unknown;
}

/** Pagination Laravel pada `data` response */
export interface LaravelPaginatorMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export type LaravelPaginator<T> = LaravelPaginatorMeta & {
  data: T[];
};

export interface WalletTransactionsResponse {
  success?: boolean;
  message?: string;
  data?: WalletTransactionItem[] | LaravelPaginator<WalletTransactionItem>;
}

export interface WalletAllTransactionsResponse {
  success?: boolean;
  message?: string;
  data?: LaravelPaginator<WalletTransactionItem>;
}

/** Query GET .../wallet/transactions/all */
export type WalletAllTransactionsQuery = {
  user_id?: number;
  amount_min?: number;
  amount_max?: number;
  date_from?: string;
  date_to?: string;
  type?: "topup" | "withdraw" | "cod_income" | "payment";
  status?: "pending" | "success" | "failed";
  page?: number;
  per_page?: number;
};

/** Query GET /admin/wallet/transactions (riwayat pribadi). Semua opsional, boleh digabung. */
export type WalletMyTransactionsQuery = {
  /** Cari di keterangan dan nomor referensi (topup/pembayaran). */
  search?: string;
  /** YYYY-MM-DD, inklusif (00:00:00 zona Asia/Jakarta). */
  date_from?: string;
  /** YYYY-MM-DD, inklusif (sampai 23:59:59). BE membalas 422 bila lebih awal dari date_from. */
  date_to?: string;
  type?: "topup" | "withdraw" | "cod_income" | "payment";
  status?: "pending" | "success" | "failed";
  page?: number;
  per_page?: number;
};

/** POST /admin/wallet/withdraw — body mengikuti collection */
export interface WalletWithdrawRequest {
  amount: number;
  bank_account_id: number;
  description?: string;
}

export interface WalletWithdrawResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

/** GET /admin/withdraws — struktur mengikuti response API */
export interface WithdrawRecord {
  id: number | string;
  amount?: number | string;
  status?: string;
  description?: string | null;
  bank_account_id?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  user?: {
    id?: number;
    name?: string;
    email?: string;
  };
  bank_account?: {
    id?: number;
    bank_name?: string;
    account_name?: string;
    account_number?: string;
  };
  [key: string]: unknown;
}

/** GET /admin/withdraws — sejak docs/be-fe/update-per-page-5-endpoint.md,
 * `data` selalu paginator Laravel standar (bukan array polos lagi). */
export interface WithdrawListResponse {
  success?: boolean;
  message?: string;
  data?: LaravelPaginator<WithdrawRecord>;
}

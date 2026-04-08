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
  balance_before?: number | string;
  balance_after?: number | string;
  status?: string;
  description?: string;
  reference_no?: string;
  created_at?: string;
  updated_at?: string;
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

export interface WithdrawListResponse {
  success?: boolean;
  message?: string;
  data?: WithdrawRecord[] | LaravelPaginator<WithdrawRecord>;
}

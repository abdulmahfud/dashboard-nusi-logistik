export interface BankAccount {
  id: number;
  user_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  photo_rekening: string;
  photo_ktp: string;
  status: "pending" | "approved" | "rejected";
  verified_at: string | null;
  rejected_reason: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  photo_rekening_url?: string;
  photo_ktp_url?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    whatsapp: string | null;
    email_verified_at: string | null;
    balance: string;
    created_at: string;
    updated_at: string;
  };
}

export interface BankAccountListResponse {
  success: boolean;
  data: BankAccount[];
}

export interface BankAccountDetailResponse {
  success: boolean;
  data: BankAccount & {
    photo_rekening_url: string;
    photo_ktp_url: string;
    user: {
      id: number;
      name: string;
      email: string;
      whatsapp: string | null;
      email_verified_at: string | null;
      balance: string;
      created_at: string;
      updated_at: string;
    };
  };
}

export interface BankAccountCreateRequest {
  bank_name: string;
  account_name: string;
  account_number: string;
  photo_rekening: File;
  photo_ktp: File;
}

export interface BankAccountCreateResponse {
  success: boolean;
  message: string;
  data: BankAccount;
}

export interface BankAccountActionResponse {
  success: boolean;
  message: string;
}

/** Query GET /admin/bank-accounts/all — mengikuti collection */
export type BankAccountsAllQuery = {
  user_id?: number;
  status?: "pending" | "approved" | "rejected";
  search?: string;
  page?: number;
  /** 1–100, default backend 20 */
  per_page?: number;
};

export interface BankAccountPaginatorMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export type BankAccountLaravelPaginator = BankAccountPaginatorMeta & {
  data: BankAccount[];
};

/** Response GET /admin/bank-accounts/all */
export interface BankAccountAllListResponse {
  success?: boolean;
  message?: string;
  data?: BankAccountLaravelPaginator | BankAccount[];
}

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

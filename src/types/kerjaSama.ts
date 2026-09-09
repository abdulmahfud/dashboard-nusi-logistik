// Tipe untuk fitur Akun Kerja Sama (postpaid/kredit) & Invoice Kerja Sama
// Lihat docs/be-fe/kerja-sama-akun-invoice.md

export type KerjaSamaAccountType = "personal" | "corporate";
export type KerjaSamaBillingMode = "prepaid" | "postpaid" | "cod";

export interface KerjaSamaAccount {
  id: number;
  name: string;
  email: string;
  whatsapp?: string | null;
  account_type: KerjaSamaAccountType;
  billing_mode: KerjaSamaBillingMode;
  credit_limit: string | number;
  max_outstanding: string | number | null;
  billing_term_days: number;
  kerja_sama_is_active: boolean;
  kerja_sama_activated_at?: string | null;
  suspended_at?: string | null;
  suspended_reason?: string | null;
  company_name?: string | null;
  company_legality_no?: string | null;
  npwp?: string | null;
  pic_name?: string | null;
  pic_ktp_no?: string | null;
  ktp_no?: string | null;
  billing_address?: string | null;
  billing_phone?: string | null;
  billing_email?: string | null;
  billing_bank_name?: string | null;
  billing_bank_account_name?: string | null;
  billing_bank_account_no?: string | null;
  pic_penagihan_name?: string | null;
  pic_penagihan_phone?: string | null;
  kerja_sama_notes?: string | null;
  /** Hanya ada di response detail (`show`), dihitung real-time dari ledger. */
  outstanding_balance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface KerjaSamaPaginator<T> {
  current_page: number;
  data: T[];
  total: number;
  per_page: number;
  last_page: number;
  [key: string]: unknown;
}

export interface KerjaSamaAccountListResponse {
  status: string;
  data: KerjaSamaPaginator<KerjaSamaAccount>;
}

export interface KerjaSamaAccountDetailResponse {
  status: string;
  data: KerjaSamaAccount;
}

export interface CreateKerjaSamaAccountPayload {
  user_id: number;
  account_type: KerjaSamaAccountType;
  company_name?: string;
  company_legality_no?: string;
  npwp?: string;
  pic_name?: string;
  pic_ktp_no?: string;
  ktp_no?: string;
  billing_address?: string;
  billing_phone?: string;
  billing_email?: string;
  billing_bank_name?: string;
  billing_bank_account_name?: string;
  billing_bank_account_no?: string;
  credit_limit: number;
  max_outstanding?: number;
  billing_term_days?: number;
  pic_penagihan_name?: string;
  pic_penagihan_phone?: string;
  kerja_sama_notes?: string;
}

/** PUT update: subset field profil/legalitas/bank — TIDAK termasuk credit_limit/billing_mode/status aktif. */
export type UpdateKerjaSamaAccountPayload = Partial<
  Omit<
    CreateKerjaSamaAccountPayload,
    "user_id" | "credit_limit" | "max_outstanding" | "billing_term_days"
  >
>;

export interface UpdateCreditLimitPayload {
  credit_limit: number;
  max_outstanding?: number | null;
  billing_term_days?: number;
}

export interface ToggleActivePayload {
  reason?: string;
}

export interface ToggleActiveResponse {
  status: string;
  message: string;
  data: {
    kerja_sama_is_active: boolean;
    suspended_at?: string | null;
    suspended_reason?: string | null;
  };
}

export type KerjaSamaLedgerType =
  | "charge"
  | "adjustment"
  | "payment"
  | "write_off";
export type KerjaSamaLedgerStatus =
  | "pending"
  | "confirmed"
  | "invoiced"
  | "voided";

export interface KerjaSamaLedgerEntry {
  id: number;
  order_id?: number | null;
  type: KerjaSamaLedgerType;
  amount: string | number;
  status: KerjaSamaLedgerStatus;
  description?: string | null;
  created_at: string;
}

export interface KerjaSamaLedgerResponse {
  status: string;
  data: KerjaSamaPaginator<KerjaSamaLedgerEntry>;
  outstanding_balance: number;
}

export interface RecordPaymentPayload {
  amount: number;
  description?: string;
  kerja_sama_invoice_id?: number;
}

export interface RecordPaymentResponse {
  status: string;
  message?: string;
  data: {
    transaction: KerjaSamaLedgerEntry;
    outstanding_balance: number;
  };
}

export type KerjaSamaInvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "void";

export interface KerjaSamaInvoiceLineItem {
  order_id: number;
  reference_no: string;
  awb_no: string | null;
  vendor: string;
  shipment_date: string;
  sender_name?: string | null;
  receiver_name?: string | null;
  weight?: number | null;
  service_code?: string | null;
  ongkir: number;
  surcharge: number;
  discount: number;
  tax: number;
  total: number;
  due_date: string;
}

export interface KerjaSamaInvoice {
  id: number;
  invoice_no: string;
  status: KerjaSamaInvoiceStatus;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    company_name?: string | null;
  } | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string;
  subtotal: string | number;
  surcharge_total: string | number;
  discount_total: string | number;
  tax_total: string | number;
  grand_total: string | number;
  paid_amount: string | number;
  line_items?: KerjaSamaInvoiceLineItem[];
  pdf_path?: string | null;
  created_at?: string;
}

export interface KerjaSamaInvoiceListResponse {
  status: string;
  data: KerjaSamaPaginator<KerjaSamaInvoice>;
}

export interface KerjaSamaInvoiceDetailResponse {
  status: string;
  data: KerjaSamaInvoice;
}

export interface GenerateInvoicePayload {
  user_id: number;
  period_start?: string;
  period_end?: string;
}

export interface GenerateInvoiceResponse {
  status: string;
  message: string;
  data: KerjaSamaInvoice;
}

export const KERJA_SAMA_INVOICE_STATUS_LABEL: Record<
  KerjaSamaInvoiceStatus,
  string
> = {
  draft: "Draft",
  issued: "Terkirim",
  partially_paid: "Sebagian Lunas",
  paid: "Lunas",
  overdue: "Jatuh Tempo",
  void: "Dibatalkan",
};

export const KERJA_SAMA_LEDGER_STATUS_LABEL: Record<
  KerjaSamaLedgerStatus,
  string
> = {
  pending: "Belum Sampai",
  confirmed: "Terkonfirmasi",
  invoiced: "Sudah Ditagih",
  voided: "Dibatalkan",
};

export const KERJA_SAMA_LEDGER_TYPE_LABEL: Record<KerjaSamaLedgerType, string> =
  {
    charge: "Tagihan",
    adjustment: "Penyesuaian",
    payment: "Pembayaran",
    write_off: "Hapus Buku",
  };

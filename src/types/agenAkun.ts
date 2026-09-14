// Tipe untuk fitur Akun Agen (prepaid, bayar via saldo wallet saja)
// Lihat docs/be-fe/akun-agen.md

import type { KerjaSamaPaginator } from "@/types/kerjaSama";

export interface AgenAccount {
  id: number;
  name: string;
  email: string;
  whatsapp?: string | null;
  account_type: "agen";
  billing_mode: "prepaid";
  company_name?: string | null;
  company_legality_no?: string | null;
  npwp?: string | null;
  pic_name?: string | null;
  pic_ktp_no?: string | null;
  billing_address?: string | null;
  billing_phone?: string | null;
  billing_email?: string | null;
  billing_bank_name?: string | null;
  billing_bank_account_name?: string | null;
  billing_bank_account_no?: string | null;
  pic_penagihan_name?: string | null;
  pic_penagihan_phone?: string | null;
  kerja_sama_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AgenAccountListResponse {
  status: string;
  data: KerjaSamaPaginator<AgenAccount>;
}

export interface AgenAccountDetailResponse {
  status: string;
  data: AgenAccount;
}

export interface CreateAgenAccountPayload {
  user_id: number;
  company_name: string;
  pic_name: string;
  company_legality_no?: string;
  npwp?: string;
  pic_ktp_no?: string;
  billing_address?: string;
  billing_phone?: string;
  billing_email?: string;
  billing_bank_name?: string;
  billing_bank_account_name?: string;
  billing_bank_account_no?: string;
  pic_penagihan_name?: string;
  pic_penagihan_phone?: string;
  kerja_sama_notes?: string;
}

export type UpdateAgenAccountPayload = Partial<
  Omit<CreateAgenAccountPayload, "user_id">
>;

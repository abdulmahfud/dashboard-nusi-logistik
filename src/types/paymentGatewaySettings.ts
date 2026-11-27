export interface PaymentGatewaySetting {
  id: number;
  /** Lowercase, kunci internal ('xendit' | 'midtrans'). */
  gateway: string;
  is_active: boolean;
  /** Hanya satu baris yang boleh true - gateway ini yang dipakai checkout "Pembayaran Online". */
  is_default: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentGatewaySettingsListResponse {
  success: boolean;
  data: PaymentGatewaySetting[];
}

export type PaymentGatewaySettingPatchBody = {
  is_active?: boolean;
  is_default?: boolean;
  note?: string | null;
};

export interface PaymentGatewaySettingPatchResponse {
  success: boolean;
  message?: string;
  data?: PaymentGatewaySetting;
}

export interface ExpeditionVendorSetting {
  id: number;
  vendor: string;
  is_active: boolean;
  is_cod_active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpeditionVendorSettingsListResponse {
  success: boolean;
  data: ExpeditionVendorSetting[];
}

export type ExpeditionVendorSettingPatchBody = {
  is_active?: boolean;
  is_cod_active?: boolean;
  note?: string | null;
};

export interface ExpeditionVendorSettingPatchResponse {
  success: boolean;
  message?: string;
  data?: ExpeditionVendorSetting;
}

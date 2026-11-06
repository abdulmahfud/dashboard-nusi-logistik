export interface UserRole {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  pivot: {
    model_type: string;
    model_id: number;
    role_id: number;
  };
}

/** Query GET /api/admin/users (collection + UserController::index). */
export type GetUsersQueryParams = {
  search?: string;
  page?: number;
  /** Filter Spatie role `name` (guard api). Jika `role` dan `role_name` dikirim, backend memakai `role` dulu. */
  role?: string;
  role_name?: string;
  /** 1–100; default backend 5 jika tidak dikirim */
  per_page?: number;
  /** account_type=corporate AND corporate_approved_at IS NULL - antrean pendaftaran perusahaan. */
  pending_corporate?: boolean;
};

export interface User {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles: UserRole[];
  account_type?: "personal" | "corporate";
  company_name?: string | null;
  jenis_usaha?: string | null;
  npwp?: string | null;
  nib?: string | null;
  pic_name?: string | null;
  billing_address?: string | null;
  corporate_approved_at?: string | null;
  corporate_rejected_at?: string | null;
  corporate_rejected_reason?: string | null;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: User[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface UserDetailResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  whatsapp: string;
  roles?: string[];
}

export interface UserUpdateRequest {
  name: string;
  email: string;
  whatsapp: string;
  password?: string;
  password_confirmation?: string;
  role?: string;
}

export interface UserCreateResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UserUpdateResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UserDeleteResponse {
  success: boolean;
  message: string;
}

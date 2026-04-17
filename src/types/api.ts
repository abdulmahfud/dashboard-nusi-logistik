export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  email_verified_at: string | null;
  created_at?: string;
  updated_at?: string;
  roles: string[];
  permissions: string[];
  /** Saldo dompet (string dari API), jika dikirim di GET /admin/me */
  balance?: string | number;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: UserData[];
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

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

/** User pada respons login (subset GET /admin/me; field boleh parsial) */
export interface LoginResponseUser {
  id?: number;
  name?: string;
  email?: string;
  email_verified_at?: string | null;
  whatsapp?: string;
  roles?: string[];
  permissions?: string[];
}

/** Map permission → boolean dari backend login */
export type LoginPermissionsMap = Record<string, boolean>;

export interface LoginResponse {
  success?: boolean;
  user?: LoginResponseUser;
  permissions?: LoginPermissionsMap | string[];
  token?: string;
  access_token?: string;
  /** Beberapa instalasi Laravel membungkus token + user di `data` */
  data?: {
    token?: string;
    access_token?: string;
    user?: LoginResponseUser;
  };
  avatar?: string | null;
  message?: string;
}

import axios, { AxiosInstance, AxiosError } from "axios";
import axiosRetry from "axios-retry";
import { getCookie, deleteCookie } from "cookies-next";
import type {
  ShipperListResponse,
  ReceiverListResponse,
  ProvinceListResponse,
  RegencyListResponse,
  DistrictListResponse,
} from "@/types/dataRegulerForm";
import type {
  ReceiverListResponse as ReceiverDataListResponse,
  ReceiverResponse,
  ReceiverCreateRequest,
  ReceiverUpdateRequest,
} from "@/types/dataPenerima";
import type {
  ShipperListResponse as ShipperDataListResponse,
  ShipperResponse,
  ShipperCreateRequest,
  ShipperUpdateRequest,
} from "@/types/dataPengirim";
import type { OrderListResponse } from "@/types/laporanPengiriman";
import type {
  OrderRequest,
  OrderResponse,
  ExpeditionVendor,
} from "@/types/order";
import type { AddressSearchResponse } from "@/types/addressSearch";
import type {
  GetUsersQueryParams,
  UserListResponse,
  UserDetailResponse,
  UserCreateRequest,
  UserCreateResponse,
  UserUpdateRequest,
  UserUpdateResponse,
  UserDeleteResponse,
} from "@/types/users";
import type {
  RoleListResponse,
  RoleDetailResponse,
  RoleCreateRequest,
  RoleCreateResponse,
  RoleUpdateRequest,
  RoleUpdateResponse,
  RoleDeleteResponse,
  PermissionListResponse,
  SimpleRoleListResponse,
} from "@/types/roles";
import type {
  BankAccountListResponse,
  BankAccountCreateRequest,
  BankAccountCreateResponse,
  BankAccount,
  BankAccountsAllQuery,
  BankAccountAllListResponse,
  BankAccountLaravelPaginator,
} from "@/types/bankAccount";
import type { StandardizedTrackingResponse } from "@/types/tracking";
import type { ExpeditionDiscount } from "@/types/discount";
import type {
  WalletBalanceResponse,
  WalletTopupResponse,
  WalletTransactionsResponse,
  WalletTransactionItem,
  WalletAllTransactionsResponse,
  WalletAllTransactionsQuery,
  LaravelPaginator,
  LaravelPaginatorMeta,
  WalletWithdrawRequest,
  WalletWithdrawResponse,
  WithdrawListResponse,
  WithdrawRecord,
} from "@/types/wallet";
import type {
  ExpeditionVendorSettingsListResponse,
  ExpeditionVendorSettingPatchBody,
  ExpeditionVendorSettingPatchResponse,
} from "@/types/expeditionVendorSettings";
import type { SupportTicketPatchBody } from "@/types/supportTicket";
import { isDashboardGatewayReturnPath } from "@/lib/dashboard-gateway-return-paths";
import { clearPendingVerificationEmail } from "@/lib/pending-verification-email";

// Ambil URL dari .env
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const API_TIMEOUT = 30000;
const SHIPMENT_COST_TIMEOUT = 60000; // 60 seconds for shipping cost APIs (longer processing time)

// Buat instance axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const isDev = process.env.NODE_ENV === "development";

// Tambahkan fungsi logout terpusat
export function logout() {
  if (typeof window !== "undefined") {
    clearPendingVerificationEmail();
    void import("@/lib/admin-me")
      .then((m) => m.clearAdminMeCache())
      .catch(() => {});
  }

  // Hapus cookie token (pastikan domain cocok!)
  deleteCookie("token", {
    path: "/",
    ...(isDev ? {} : { domain: ".bhisakirim.com" }),
  });

  // Arahkan ke login
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
  }
}

// ✅ Retry otomatis jika error jaringan atau 5xx
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError): boolean => {
    const status = error.response?.status;
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      status === 429 ||
      (typeof status === "number" && status >= 500)
    );
  },
});

// ✅ Inject Authorization header dari cookie
apiClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData && config.headers) {
      // Default instance pakai application/json; untuk multipart wajib biarkan
      // browser set Content-Type + boundary agar file ter-parse di Laravel.
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete (config.headers as Record<string, unknown>)["Content-Type"];
      }
    }
    const token = getCookie("token");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Tangani error 401 + hindari infinite redirect
let isRedirecting = false;

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const path =
      typeof window !== "undefined" ? window.location.pathname : "";
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !path.includes("/login") &&
      !isDashboardGatewayReturnPath(path) &&
      !isRedirecting
    ) {
      isRedirecting = true;
      logout();
    }

    return Promise.reject(error);
  }
);

// ✅ Get shippers
export const getShippers = async (): Promise<ShipperListResponse> => {
  const res = await apiClient.get("/admin/shipper");
  return res.data;
};

// ✅ Get receivers
export const getReceivers = async (): Promise<ReceiverListResponse> => {
  const res = await apiClient.get("/admin/receiver");
  return res.data;
};

// ✅ Get provinces
export const getProvinces = async (): Promise<ProvinceListResponse> => {
  const res = await apiClient.get("/public/provinces");
  return res.data;
};

// ✅ Get regencies by province
export const getRegencies = async (
  provinceId: number
): Promise<RegencyListResponse> => {
  const res = await apiClient.get(`/public/provinces/${provinceId}/regencies`);
  return res.data;
};

// ✅ Get districts by regency
export const getDistricts = async (
  regencyId: number
): Promise<DistrictListResponse> => {
  const res = await apiClient.get(`/public/regencies/${regencyId}/districts`);
  return res.data;
};

// ✅ Get JNT Express shipment cost
export const getJntExpressShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  // Weight sudah dalam kilogram (dikonversi dari gram di frontend)
  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weight.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/jntexpress/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Get Paxel shipment cost
export const getPaxelShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weight.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/paxel/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Get Lion Parcel shipment cost
export const getLionShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  // Weight sudah dalam kilogram (dikonversi dari gram di frontend)
  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weight.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/lion/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Get SAP shipment cost
export const getSapShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  // Weight sudah dalam kilogram (dikonversi dari gram di frontend)
  // Pastikan format string (hilangkan trailing zero jika ada, misalnya "2.0" -> "2")
  const weightValue = typeof weight === "string" 
    ? weight 
    : weight.toString();
  
  // Hapus trailing zero dan titik desimal jika tidak perlu (misalnya "2.0" -> "2", "1.5" -> "1.5")
  const cleanWeight = weightValue.includes(".")
    ? weightValue.replace(/\.?0+$/, "")
    : weightValue;

  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: cleanWeight,
  };

  const res = await apiClient.post(
    "/admin/expedition/sap/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Get Pos Indonesia shipment cost
export const getPosIndonesiaShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  // Weight sudah dalam kilogram (dikonversi dari gram di frontend)
  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weight.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/posindonesia/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Get JNE shipment cost
export const getJneShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  // Weight sudah dalam kilogram (dikonversi dari gram di frontend)
  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weight.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/jne/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Get ID Express shipment cost
export const getIdexpressShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  // Weight sudah dalam kilogram (dikonversi dari gram di frontend)
  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weight.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/idexpress/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Get Anteraja shipment cost
export const getAnterajaShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  // Weight sudah dalam kilogram (dikonversi dari gram di frontend)
  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weight.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/anteraja/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Get Ninja shipment cost
export const getNinjaShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  // Weight sudah dalam kilogram (dikonversi dari gram di frontend)
  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weight.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/ninja/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Get J&T Cargo shipment cost
export const getJntCargoShipmentCost = async ({
  origin_province,
  origin_regencie,
  origin_district,
  destination_province,
  destination_regencie,
  destination_district,
  weight,
}: {
  origin_province: string;
  origin_regencie: string;
  origin_district: string;
  destination_province: string;
  destination_regencie: string;
  destination_district: string;
  weight: string | number;
}) => {
  // Weight sudah dalam kilogram (dikonversi dari gram di frontend)
  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weight.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/jntcargo/shipment_cost",
    requestPayload,
    {
      timeout: SHIPMENT_COST_TIMEOUT,
    }
  );
  return res.data;
};

// ✅ Receiver CRUD operations
export const getReceiversData = async (
  search?: string,
  page?: number
): Promise<ReceiverDataListResponse> => {
  const params: { search?: string; page?: number } = {};
  if (search) params.search = search;
  if (page) params.page = page;

  const res = await apiClient.get("/admin/receiver", { params });
  return res.data;
};

export const createReceiver = async (
  data: ReceiverCreateRequest
): Promise<ReceiverResponse> => {
  const res = await apiClient.post("/admin/receiver", data);
  return res.data;
};

export const updateReceiver = async (
  id: number,
  data: ReceiverUpdateRequest
): Promise<ReceiverResponse> => {
  const res = await apiClient.put(`/admin/receiver/${id}`, data);
  return res.data;
};

export const deleteReceiver = async (id: number): Promise<ReceiverResponse> => {
  const res = await apiClient.delete(`/admin/receiver/${id}`);
  return res.data;
};

export const getReceiverById = async (
  id: number
): Promise<ReceiverResponse> => {
  const res = await apiClient.get(`/admin/receiver/${id}`);
  return res.data;
};

// ✅ Shipper CRUD operations
export const getShippersData = async (
  search?: string,
  page?: number
): Promise<ShipperDataListResponse> => {
  const params: { search?: string; page?: number } = {};
  if (search) params.search = search;
  if (page) params.page = page;

  const res = await apiClient.get("/admin/shipper", { params });
  return res.data;
};

export const createShipper = async (
  data: ShipperCreateRequest
): Promise<ShipperResponse> => {
  const res = await apiClient.post("/admin/shipper", data);
  return res.data;
};

export const updateShipper = async (
  id: number,
  data: ShipperUpdateRequest
): Promise<ShipperResponse> => {
  const res = await apiClient.put(`/admin/shipper/${id}`, data);
  return res.data;
};

export const deleteShipper = async (id: number): Promise<ShipperResponse> => {
  const res = await apiClient.delete(`/admin/shipper/${id}`);
  return res.data;
};

export const getShipperById = async (id: number): Promise<ShipperResponse> => {
  const res = await apiClient.get(`/admin/shipper/${id}`);
  return res.data;
};

// ✅ Orders/Laporan Pengiriman operations
export const getOrders = async (
  startDate?: string,
  endDate?: string
): Promise<OrderListResponse> => {
  const params: { start_date?: string; end_date?: string } = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const res = await apiClient.get("/admin/list-orders", { params });
  return res.data;
};

// ✅ Get order statistics from backend
export const getOrderStatistics = async (
  startDate?: string,
  endDate?: string
): Promise<{
  data: {
    date_range: { start_date: string; end_date: string };
    total_orders: number;
    package_types: {
      regular: number;
      cod: number;
      instant: number;
    };
    status_overview: {
      belum_proses: number;
      belum_di_expedisi: number;
      proses_pengiriman: number;
      kendala_pengiriman: number;
      sampai_tujuan: number;
      retur: number;
      dibatalkan: number;
    };
    regular_package_stats: {
      total: number;
      belum_proses: number;
      belum_di_expedisi: number;
      proses_pengiriman: number;
      kendala_pengiriman: number;
      sampai_tujuan: number;
      retur: number;
      dibatalkan: number;
    };
    cod_package_stats: {
      total: number;
      belum_proses: number;
      belum_di_expedisi: number;
      proses_pengiriman: number;
      kendala_pengiriman: number;
      sampai_tujuan: number;
      retur: number;
      dibatalkan: number;
    };
    trouble_stats: {
      no_update_4_to_7_days: number;
      no_update_8_to_30_days: number;
      no_update_over_30_days: number;
    };
  };
}> => {
  const params: { start_date?: string; end_date?: string } = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const res = await apiClient.get("/admin/order-statistics", { params });
  return res.data;
};

// ✅ Get monthly summary
export const getMonthlySummary = async (
  year?: number,
  month?: number
): Promise<{
  data: {
    month: number;
    year: number;
    total_orders: number;
    total_revenue: number;
    period: string;
  };
}> => {
  const params: { year?: number; month?: number } = {};
  if (year) params.year = year;
  if (month) params.month = month;

  const res = await apiClient.get("/admin/monthly-summary", { params });
  return res.data;
};

// ✅ Order submission to expedition vendors
export const submitOrderToExpedition = async (
  vendor: ExpeditionVendor,
  orderData: OrderRequest
): Promise<OrderResponse> => {
  const res = await apiClient.post(
    `/admin/expedition/${vendor}/order`,
    orderData
  );
  return res.data;
};

// ✅ JNT Express order submission (specific method)
export const submitJntExpressOrder = async (
  orderData: OrderRequest
): Promise<OrderResponse> => {
  const res = await apiClient.post(
    "/admin/expedition/jntexpress/order",
    orderData
  );
  return res.data;
};

// ✅ Lion order submission (for future use)
export const submitLionOrder = async (
  orderData: OrderRequest
): Promise<OrderResponse> => {
  const res = await apiClient.post("/admin/expedition/lion/order", orderData);
  return res.data;
};

// ✅ SAP order submission (for future use)
export const submitSapOrder = async (
  orderData: OrderRequest
): Promise<OrderResponse> => {
  const res = await apiClient.post("/admin/expedition/sap/order", orderData);
  return res.data;
};

// ✅ Search address (provinces, regencies, districts, subdistricts, postal codes)
export const searchAddress = async (
  query: string
): Promise<AddressSearchResponse> => {
  const res = await apiClient.get(
    `/public/search-address?query=${encodeURIComponent(query)}`
  );
  return res.data;
};

// ✅ New search address API (returns results with full_address)
export const searchAddressNew = async (
  query: string
): Promise<{
  results: Array<{
    type: "postal_code" | "subdistrict";
    id: number;
    name: string | number;
    full_address: string;
    code?: number | null;
    province: string;
    regency: string;
    district: string;
    subdistrict: string;
    province_id: number;
    regency_id: number;
    district_id: number;
    subdistrict_id: number;
  }>;
  count: number;
}> => {
  const res = await apiClient.get(
    `/public/search-address?query=${encodeURIComponent(query)}`
  );
  return res.data;
};

// ✅ User registration
export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  whatsapp: string;
}) => {
  const res = await apiClient.post("/register", data);
  return res.data;
};

// ✅ Resend email verification
export const resendEmailVerification = async () => {
  const res = await apiClient.post("/email/resend");
  return res.data;
};

// ✅ Cancel order functions for different vendors
export const cancelJntExpressOrder = async (data: {
  orderid: string;
  remark: string;
}) => {
  const res = await apiClient.post("/admin/expedition/jntexpress/cancel", data);
  return res.data;
};

export const cancelLionOrder = async (data: {
  orderid: string;
  remark: string;
}) => {
  const res = await apiClient.post("/admin/expedition/lion/cancel", data);
  return res.data;
};

export const cancelSapOrder = async (data: {
  orderid: string;
  remark: string;
}) => {
  const res = await apiClient.post("/admin/expedition/sap/cancel", data);
  return res.data;
};

// ✅ User management functions
export const getCurrentUser = async (): Promise<UserDetailResponse> => {
  try {
    const res = await apiClient.get("/admin/me");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    throw error;
  }
};

export const getUsers = async (
  params: GetUsersQueryParams = {}
): Promise<UserListResponse> => {
  const q: Record<string, string | number> = {};
  if (params.search != null && params.search !== "") q.search = params.search;
  if (params.page != null) q.page = params.page;
  if (params.role != null && params.role !== "") q.role = params.role;
  if (params.role_name != null && params.role_name !== "")
    q.role_name = params.role_name;
  if (params.per_page != null) q.per_page = params.per_page;

  const res = await apiClient.get("/admin/users", { params: q });
  return res.data;
};

export const getUserById = async (id: number): Promise<UserDetailResponse> => {
  const res = await apiClient.get(`/admin/users/${id}`);
  return res.data;
};

export const createUser = async (
  data: UserCreateRequest
): Promise<UserCreateResponse> => {
  const res = await apiClient.post("/admin/users", data);
  return res.data;
};

export const updateUser = async (
  id: number,
  data: UserUpdateRequest
): Promise<UserUpdateResponse> => {
  const res = await apiClient.put(`/admin/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id: number): Promise<UserDeleteResponse> => {
  const res = await apiClient.delete(`/admin/users/${id}`);
  return res.data;
};

export const getRoles = async (): Promise<RoleListResponse> => {
  const res = await apiClient.get("/admin/roles");
  return res.data;
};

// ✅ Role management functions
export const getRolesWithPagination = async (
  search?: string,
  page?: number
): Promise<RoleListResponse> => {
  const params: { search?: string; page?: number } = {};
  if (search) params.search = search;
  if (page) params.page = page;

  const res = await apiClient.get("/admin/roles", { params });
  return res.data;
};

export const getRoleById = async (id: number): Promise<RoleDetailResponse> => {
  const res = await apiClient.get(`/admin/roles/${id}`);
  return res.data;
};

export const createRole = async (
  data: RoleCreateRequest
): Promise<RoleCreateResponse> => {
  const res = await apiClient.post("/admin/roles", data);
  return res.data;
};

export const updateRole = async (
  id: number,
  data: RoleUpdateRequest
): Promise<RoleUpdateResponse> => {
  const res = await apiClient.put(`/admin/roles/${id}`, data);
  return res.data;
};

export const deleteRole = async (id: number): Promise<RoleDeleteResponse> => {
  const res = await apiClient.delete(`/admin/roles/${id}`);
  return res.data;
};

export const getAllRoles = async (): Promise<SimpleRoleListResponse> => {
  const res = await apiClient.get("/admin/roles/all");
  return res.data;
};

export const getPermissions = async (): Promise<PermissionListResponse> => {
  const res = await apiClient.get("/admin/permissions");
  return res.data;
};

export const getAllPermissions = async (): Promise<PermissionListResponse> => {
  const res = await apiClient.get("/admin/permissions/all");
  return res.data;
};

// ✅ Bank Account CRUD operations
export const getBankAccounts = async (): Promise<BankAccountListResponse> => {
  const res = await apiClient.get("/admin/bank-accounts");
  return res.data;
};

/** Semua rekening (semua user), paginasi & filter — GET /admin/bank-accounts/all (bank-accounts.view_all) */
export const getBankAccountsAll = async (
  params?: BankAccountsAllQuery
): Promise<BankAccountAllListResponse> => {
  const res = await apiClient.get<BankAccountAllListResponse>(
    "/admin/bank-accounts/all",
    { params }
  );
  return res.data;
};

export function normalizeBankAccountsAllPage(
  payload: BankAccountAllListResponse | undefined
): { rows: BankAccount[]; meta: BankAccountLaravelPaginator | null } {
  if (!payload?.data) return { rows: [], meta: null };
  const d = payload.data;
  if (Array.isArray(d)) {
    return { rows: d, meta: null };
  }
  if (
    typeof d === "object" &&
    "data" in d &&
    Array.isArray((d as BankAccountLaravelPaginator).data)
  ) {
    return { rows: (d as BankAccountLaravelPaginator).data, meta: d as BankAccountLaravelPaginator };
  }
  return { rows: [], meta: null };
}

export const createBankAccount = async (
  data: BankAccountCreateRequest
): Promise<BankAccountCreateResponse> => {
  const formData = new FormData();
  formData.append("bank_name", data.bank_name);
  formData.append("account_name", data.account_name);
  formData.append("account_number", data.account_number);
  formData.append("photo_rekening", data.photo_rekening);
  formData.append("photo_ktp", data.photo_ktp);

  const res = await apiClient.post("/admin/bank-accounts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updateBankAccount = async (
  id: number,
  data: BankAccountCreateRequest
): Promise<BankAccountCreateResponse> => {
  const res = await apiClient.put(`/admin/bank-accounts/${id}`, data);
  return res.data;
};

export const deleteBankAccount = async (
  id: number
): Promise<BankAccountCreateResponse> => {
  const res = await apiClient.delete(`/admin/bank-accounts/${id}`);
  return res.data;
};

export const getBankAccountById = async (
  id: number
): Promise<{
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
}> => {
  const res = await apiClient.get(`/admin/bank-accounts/${id}`);
  return res.data;
};

export const approveBankAccount = async (
  id: number
): Promise<{
  success: boolean;
  message: string;
}> => {
  const res = await apiClient.post(`/admin/bank-accounts/${id}/approve`);
  return res.data;
};

export const rejectBankAccount = async (
  id: number,
  reason: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  const res = await apiClient.post(`/admin/bank-accounts/${id}/reject`, {
    reason,
  });
  return res.data;
};

export const getBankAccountFile = async (
  id: number,
  type: "rekening" | "ktp"
): Promise<string> => {
  const res = await apiClient.get(`/admin/bank-accounts/${id}/file/${type}`, {
    responseType: "blob",
  });
  return URL.createObjectURL(res.data);
};

// ✅ Get label URL for JNT Express orders
export const getLabelUrl = async (
  awbNo: string
): Promise<{
  status: string;
  message: string;
  data?: {
    awb_no: string;
    label_url: string;
    billcode: string;
  };
}> => {
  const res = await apiClient.post("/admin/get-label-url", {
    awb_no: awbNo,
  });
  return res.data;
};

// ✅ Download/View label PDF for any order (universal)
export const downloadOrderLabel = async (orderId: number): Promise<Blob> => {
  try {
    const res = await apiClient.get(`/admin/orders/${orderId}/label`, {
      responseType: "blob",
    });
    return res.data;
  } catch (error: unknown) {
    // Handle blob error response - try to parse error message from blob
    if (error instanceof AxiosError && error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || "Failed to download label");
      } catch {
        throw new Error("Failed to download label");
      }
    }
    throw error;
  }
};

// ✅ Universal tracking function using awb_no (supports all vendors)
export const trackOrderByAwb = async (
  awb_no: string
): Promise<StandardizedTrackingResponse> => {
  const res = await apiClient.get("/admin/tracking", {
    params: { awb_no },
  });
  return res.data;
};

/** Detail tracking Lion: `vendor_response.stts[].chargeable_total_tariff` + `order.request_payload` */
export const getLionExpeditionTracking = async (
  awb_no: string
): Promise<unknown> => {
  const res = await apiClient.get("/admin/expedition/lion/tracking", {
    params: { awb_no },
  });
  return res.data;
};

// ✅ Legacy function for backward compatibility (using reference_no)
export const trackOrderByReference = async (
  reference_no: string
): Promise<StandardizedTrackingResponse> => {
  const res = await apiClient.get("/admin/tracking", {
    params: { reference_no },
  });
  return res.data;
};

// ✅ JNT Express tracking function (legacy - still used for direct AWB tracking)
export const trackJntExpress = async (
  awb_no: string
): Promise<StandardizedTrackingResponse> => {
  const res = await apiClient.post("/admin/expedition/jntexpress/trackingjnt", {
    awb_no,
  });
  return res.data;
};

// ✅ Payment functions
export const createPayment = async (data: {
  shipping_data: Record<string, unknown>;
  amount: number;
  payment_method?: "xendit" | "wallet";
}): Promise<{
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
    order_id?: number | null;
  };
  errors?: Record<string, unknown>;
}> => {
  const res = await apiClient.post("/admin/payments/create", data);
  return res.data;
};

export const getPaymentStatus = async (
  referenceNo: string
): Promise<{
  success: boolean;
  message?: string;
  data?: {
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
  };
}> => {
  const res = await apiClient.get(`/admin/payments/status/${referenceNo}`);
  return res.data;
};

export const getPaymentHistory = async (params?: {
  per_page?: number;
  status?: string;
}): Promise<{
  success: boolean;
  message?: string;
  data?: Record<string, unknown>[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}> => {
  const res = await apiClient.get("/admin/payments/history", { params });
  return res.data;
};

export const getAllPayments = async (params?: {
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
}): Promise<{
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}> => {
  const res = await apiClient.get("/admin/payments/all", { params });
  return res.data;
};

export function normalizeAllPayments(
  payload:
    | {
        data?: Record<string, unknown>[] | { data?: Record<string, unknown>[] };
      }
    | undefined
): Record<string, unknown>[] {
  if (!payload?.data) return [];
  if (Array.isArray(payload.data)) return payload.data;

  if (
    typeof payload.data === "object" &&
    payload.data !== null &&
    "data" in payload.data &&
    Array.isArray((payload.data as { data?: Record<string, unknown>[] }).data)
  ) {
    return (payload.data as { data?: Record<string, unknown>[] }).data ?? [];
  }

  return [];
}

export const cancelPayment = async (
  referenceNo: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  const res = await apiClient.post(`/admin/payments/cancel/${referenceNo}`);
  return res.data;
};

export const checkInvoiceStatus = async (
  invoiceId: string
): Promise<{
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}> => {
  const res = await apiClient.get(
    `/admin/payments/invoice/${invoiceId}/status`
  );
  return res.data;
};

// ✅ Create order with pending payment status
export const createOrderWithPendingPayment = async (data: {
  shipping_data: Record<string, unknown>;
  amount: number;
}): Promise<{
  success: boolean;
  message: string;
  data?: {
    order_id: number;
    reference_no: string;
    status: string;
    amount: number;
  };
  errors?: Record<string, unknown>;
}> => {
  const res = await apiClient.post("/admin/orders/create-pending", data);
  return res.data;
};

/** GET /admin/expedition-vendor-settings — expedition.settings.view */
export const getExpeditionVendorSettings =
  async (): Promise<ExpeditionVendorSettingsListResponse> => {
    const res = await apiClient.get<ExpeditionVendorSettingsListResponse>(
      "/admin/expedition-vendor-settings"
    );
    return res.data;
  };

/** PATCH /admin/expedition-vendor-settings/{vendor} — expedition.settings.update */
export const patchExpeditionVendorSettings = async (
  vendor: string,
  body: ExpeditionVendorSettingPatchBody
): Promise<ExpeditionVendorSettingPatchResponse> => {
  const res = await apiClient.patch<ExpeditionVendorSettingPatchResponse>(
    `/admin/expedition-vendor-settings/${encodeURIComponent(vendor)}`,
    body
  );
  return res.data;
};

// ✅ Get available discounts for expedition
export const getAvailableDiscounts = async (params: {
  vendor: string;
  service_type?: string;
  order_value?: number;
}): Promise<{
  status: string;
  data: {
    available_discounts: Array<{
      id: number;
      description: string;
      discount_type: "percentage" | "fixed_amount";
      discount_value: number;
      minimum_order_value: number | null;
      maximum_discount_amount: number | null;
      valid_until: string | null;
    }>;
    best_discount?: {
      has_discount: boolean;
      discount_amount: number;
      discounted_price: number;
      original_price: number;
      discount_id: number | null;
      discount_description: string | null;
      discount_type: "percentage" | "fixed_amount";
      discount_value: number;
    };
    order_value?: number;
  };
}> => {
  const res = await apiClient.get("/admin/expedition-discounts/available", {
    params,
  });
  return res.data;
};

// ✅ Expedition Discount CRUD operations
export const getExpeditionDiscounts = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<{
  status: string;
  success?: boolean;
  data: {
    data: ExpeditionDiscount[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}> => {
  const res = await apiClient.get("/admin/expedition-discounts", { params });
  return res.data;
};

export const createExpeditionDiscount = async (data: {
  vendor: string;
  service_type?: string | null;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  minimum_order_value?: number | null;
  maximum_discount_amount?: number | null;
  user_type?: string | null;
  is_active: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  description: string;
  usage_limit?: number | null;
  priority: number;
}): Promise<{
  status: string;
  success?: boolean;
  message: string;
  data: ExpeditionDiscount;
}> => {
  const res = await apiClient.post("/admin/expedition-discounts", data);
  return res.data;
};

export const updateExpeditionDiscount = async (
  id: number,
  data: {
    vendor: string;
    service_type?: string | null;
    discount_type: "percentage" | "fixed_amount";
    discount_value: number;
    minimum_order_value?: number | null;
    maximum_discount_amount?: number | null;
    user_type?: string | null;
    is_active: boolean;
    valid_from?: string | null;
    valid_until?: string | null;
    description: string;
    usage_limit?: number | null;
    priority: number;
  }
): Promise<{
  status: string;
  success?: boolean;
  message: string;
  data: ExpeditionDiscount;
}> => {
  const res = await apiClient.put(`/admin/expedition-discounts/${id}`, data);
  return res.data;
};

export const deleteExpeditionDiscount = async (
  id: number
): Promise<{
  status: string;
  success?: boolean;
  message: string;
}> => {
  const res = await apiClient.delete(`/admin/expedition-discounts/${id}`);
  return res.data;
};

export const toggleExpeditionDiscountStatus = async (
  id: number
): Promise<{
  status: string;
  success?: boolean;
  message: string;
  data: ExpeditionDiscount;
}> => {
  const res = await apiClient.patch(
    `/admin/expedition-discounts/${id}/toggle-status`
  );
  return res.data;
};

export const getExpeditionDiscountStatistics = async (): Promise<{
  success: boolean;
  data: {
    total_discounts: number;
    active_discounts: number;
    inactive_discounts: number;
    total_usage: number;
    vendors: Record<string, number>;
    discount_types: Record<string, number>;
  };
}> => {
  const res = await apiClient.get("/admin/expedition-discounts/statistics");
  return res.data;
};

export const requestWalletTopup = async (
  amount: number
): Promise<WalletTopupResponse> => {
  const res = await apiClient.post<WalletTopupResponse>(
    "/admin/wallet/topup",
    { amount }
  );
  return res.data;
};

/** Saldo wallet terbaru user login — endpoint khusus wallet */
export const getWalletBalance = async (): Promise<WalletBalanceResponse> => {
  const res = await apiClient.get<WalletBalanceResponse>("/admin/wallet/balance");
  return res.data;
};

/** Riwayat transaksi user login — permission: wallet.view */
export const getMyWalletTransactions = async (params?: {
  page?: number;
}): Promise<WalletTransactionsResponse> => {
  const res = await apiClient.get<WalletTransactionsResponse>(
    "/admin/wallet/transactions",
    { params }
  );
  return res.data;
};

/** Semua transaksi wallet (admin) — permission: wallet.transactions.view_all */
export const getAllWalletTransactions = async (
  params?: WalletAllTransactionsQuery
): Promise<WalletAllTransactionsResponse> => {
  const res = await apiClient.get<WalletAllTransactionsResponse>(
    "/admin/wallet/transactions/all",
    { params }
  );
  return res.data;
};

/** Tarik saldo — POST /admin/wallet/withdraw */
export const requestWalletWithdraw = async (
  body: WalletWithdrawRequest
): Promise<WalletWithdrawResponse> => {
  const res = await apiClient.post<WalletWithdrawResponse>(
    "/admin/wallet/withdraw",
    body
  );
  return res.data;
};

/** Daftar permintaan withdraw (admin) — GET /admin/withdraws */
export const getWithdraws = async (): Promise<WithdrawListResponse> => {
  const res = await apiClient.get<WithdrawListResponse>("/admin/withdraws");
  return res.data;
};

/** POST /admin/withdraws/:id/approve */
export const approveWithdraw = async (
  id: number | string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.post(`/admin/withdraws/${id}/approve`);
  return res.data;
};

/** POST /admin/withdraws/:id/reject */
export const rejectWithdraw = async (
  id: number | string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.post(`/admin/withdraws/${id}/reject`);
  return res.data;
};

export function normalizeWithdrawRecords(
  payload: WithdrawListResponse | undefined
): WithdrawRecord[] {
  if (!payload?.data) return [];
  const d = payload.data;
  if (Array.isArray(d)) return d;
  if (
    typeof d === "object" &&
    "data" in d &&
    Array.isArray((d as LaravelPaginator<WithdrawRecord>).data)
  ) {
    return (d as LaravelPaginator<WithdrawRecord>).data;
  }
  return [];
}

/** Normalisasi array transaksi dari response Laravel (array atau paginator). */
export function normalizeWalletTransactions(
  payload:
    | WalletTransactionsResponse
    | WalletAllTransactionsResponse
    | undefined
): WalletTransactionItem[] {
  if (!payload?.data) return [];
  const d = payload.data;
  if (Array.isArray(d)) return d;
  if (
    typeof d === "object" &&
    "data" in d &&
    Array.isArray((d as LaravelPaginator<WalletTransactionItem>).data)
  ) {
    return (d as LaravelPaginator<WalletTransactionItem>).data;
  }
  return [];
}

export function getWalletPaginatorMeta(
  payload:
    | WalletTransactionsResponse
    | WalletAllTransactionsResponse
    | undefined
): LaravelPaginatorMeta | null {
  const d = payload?.data;
  if (
    d &&
    typeof d === "object" &&
    !Array.isArray(d) &&
    "current_page" in d &&
    "last_page" in d
  ) {
    return d as LaravelPaginator<WalletTransactionItem>;
  }
  return null;
}

/** GET /admin/support/tickets — support.tickets.view / manage */
export const getSupportTickets = async (params?: {
  user_id?: number;
  status?: string;
  department?: string;
  search?: string;
  per_page?: number;
  page?: number;
}): Promise<unknown> => {
  const res = await apiClient.get("/admin/support/tickets", { params });
  return res.data;
};

/** GET /admin/support/tickets/:id */
export const getSupportTicket = async (
  id: number | string
): Promise<unknown> => {
  const res = await apiClient.get(`/admin/support/tickets/${id}`);
  return res.data;
};

/** POST /admin/support/tickets — multipart: title, department, message?, attachments[] */
export const createSupportTicket = async (
  formData: FormData
): Promise<unknown> => {
  const res = await apiClient.post("/admin/support/tickets", formData);
  return res.data;
};

/** PATCH /admin/support/tickets/:id — support.tickets.manage */
export const patchSupportTicket = async (
  id: number | string,
  body: SupportTicketPatchBody
): Promise<unknown> => {
  const res = await apiClient.patch(`/admin/support/tickets/${id}`, body);
  return res.data;
};

/** POST /admin/support/tickets/:id/messages — multipart: message?, attachments[] */
export const postSupportTicketMessage = async (
  id: number | string,
  formData: FormData
): Promise<unknown> => {
  const res = await apiClient.post(
    `/admin/support/tickets/${id}/messages`,
    formData
  );
  return res.data;
};

/** GET /admin/feedbacks — feedbacks.index */
export const getFeedbacks = async (params?: {
  user_id?: number;
  /** LIKE nama, email, atau WhatsApp pengguna */
  user_search?: string;
  rating?: number;
  /** LIKE pada kolom comment */
  search?: string;
  per_page?: number;
  page?: number;
}): Promise<unknown> => {
  const res = await apiClient.get("/admin/feedbacks", { params });
  return res.data;
};

/** POST /admin/feedbacks — feedbacks.create (body: rating, comment) */
export const createFeedback = async (body: {
  rating: number;
  comment: string;
}): Promise<unknown> => {
  const res = await apiClient.post("/admin/feedbacks", body);
  return res.data;
};

export default apiClient;

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
} from "@/types/bankAccount";
import type { StandardizedTrackingResponse } from "@/types/tracking";
import type { ExpeditionDiscount } from "@/types/discount";

// Ambil URL dari .env
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const API_TIMEOUT = 30000;

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
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login") &&
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
    requestPayload
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
    requestPayload
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
  // Konversi berat dari gram ke kilogram untuk Lion Parcel API
  const weightInKg = Number(weight) / 1000;

  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weightInKg.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/lion/shipment_cost",
    requestPayload
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
    "/admin/expedition/sap/shipment_cost",
    requestPayload
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
    requestPayload
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
  // Konversi berat dari gram ke kilogram untuk JNE API
  const weightInKg = Number(weight) / 1000;

  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weightInKg.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/jne/shipment_cost",
    requestPayload
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
    requestPayload
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
  // Konversi berat dari gram ke kilogram untuk Anteraja API
  const weightInKg = Number(weight) / 1000;

  const requestPayload = {
    origin_province,
    origin_regencie,
    origin_district,
    destination_province,
    destination_regencie,
    destination_district,
    weight: weightInKg.toString(),
  };

  const res = await apiClient.post(
    "/admin/expedition/anteraja/shipment_cost",
    requestPayload
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
  search?: string,
  page?: number
): Promise<UserListResponse> => {
  const params: { search?: string; page?: number } = {};
  if (search) params.search = search;
  if (page) params.page = page;

  const res = await apiClient.get("/admin/users", { params });
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

// ✅ Universal tracking function using reference_no (supports all vendors)
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
}): Promise<{
  success: boolean;
  message: string;
  data?: {
    payment_id: number;
    reference_no: string;
    invoice_id: string;
    invoice_url: string;
    amount: number;
    expired_at: string;
    status: string;
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

export default apiClient;

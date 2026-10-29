export type PackageClaimStatus =
  | "diajukan"
  | "dalam_pemeriksaan"
  | "menunggu_dokumen"
  | "disetujui"
  | "ditolak"
  | "selesai";

export type PackageClaimIssueType =
  | "paket_hilang"
  | "paket_rusak"
  | "tidak_diterima"
  | "keterlambatan"
  | "lainnya";

export interface PackageClaimUserRef {
  id: number;
  name?: string;
  email?: string;
}

export interface PackageClaimHandlerRef {
  id: number;
  name?: string;
}

export interface PackageClaimAttachment {
  id: number;
  original_name?: string | null;
  mime?: string | null;
  size?: number | null;
  url: string;
}

export interface PackageClaimReplyAuthorRef {
  id: number;
  name?: string;
  is_staff?: boolean;
}

export interface PackageClaimReply {
  id: number;
  message: string | null;
  author?: PackageClaimReplyAuthorRef | null;
  created_at: string;
  attachments: PackageClaimAttachment[];
}

export interface PackageClaim {
  id: number;
  reference_no: string;
  vendor: string;
  issue_type: PackageClaimIssueType | string;
  issue_type_label?: string;
  title: string;
  description: string;
  status: PackageClaimStatus | string;
  status_label?: string;
  rejection_reason?: string | null;
  order_id?: number | null;
  user?: PackageClaimUserRef | null;
  handler?: PackageClaimHandlerRef | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at?: string;
  attachments: PackageClaimAttachment[];
  replies: PackageClaimReply[];
}

export interface PackageClaimsPaginator {
  data: PackageClaim[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PackageClaimsListResponse {
  success?: boolean;
  data?: PackageClaimsPaginator;
  message?: string;
}

export interface PackageClaimStats {
  diajukan: number;
  dalam_pemeriksaan: number;
  menunggu_dokumen: number;
  disetujui: number;
  ditolak: number;
  selesai: number;
}

export interface PackageClaimStatsResponse {
  success?: boolean;
  data?: PackageClaimStats;
  message?: string;
}

export interface PackageClaimDetailResponse {
  success?: boolean;
  data?: PackageClaim;
  message?: string;
}

export interface PackageClaimUpdateBody {
  status: PackageClaimStatus | string;
  rejection_reason?: string | null;
}

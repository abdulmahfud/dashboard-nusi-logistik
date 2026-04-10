export type SupportDepartment =
  | "billing"
  | "expedition"
  | "technical"
  | "account"
  | "other";

export type SupportTicketStatus =
  | "awaiting_support"
  | "awaiting_customer"
  | "resolved"
  | "closed";

export interface SupportTicketUserRef {
  id: number;
  name?: string;
  email?: string;
}

export interface SupportTicketSummary {
  id: number;
  title: string;
  department: SupportDepartment | string;
  department_label?: string;
  status: SupportTicketStatus | string;
  status_label?: string;
  user?: SupportTicketUserRef;
  assigned_to?: number | null;
  assignee?: SupportTicketUserRef | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  last_message_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SupportMessageAttachment {
  id: number;
  original_name?: string;
  mime?: string;
  size?: number;
  url: string;
}

export interface SupportMessageAuthor {
  id: number;
  name?: string;
  email?: string;
  is_staff?: boolean;
}

export interface SupportTicketMessage {
  id: number;
  body: string | null;
  created_at: string;
  author?: SupportMessageAuthor;
  attachments?: SupportMessageAttachment[];
}

export interface SupportTicketDetail extends SupportTicketSummary {
  messages?: SupportTicketMessage[];
}

export interface SupportTicketsListResponse {
  success?: boolean;
  data?: SupportTicketSummary[] | SupportTicketsPaginator;
  message?: string;
}

export interface SupportTicketsPaginator {
  data: SupportTicketSummary[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface SupportTicketDetailResponse {
  success?: boolean;
  data?: SupportTicketDetail;
  message?: string;
}

export interface SupportTicketPatchBody {
  status?: SupportTicketStatus | string;
  assigned_to?: number | null;
}

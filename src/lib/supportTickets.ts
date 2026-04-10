import type {
  SupportTicketDetail,
  SupportTicketSummary,
  SupportTicketMessage,
  SupportMessageAttachment,
  SupportMessageAuthor,
} from "@/types/supportTicket";

export function normalizeSupportTicketsList(payload: unknown): {
  items: SupportTicketSummary[];
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
} {
  const empty = {
    items: [] as SupportTicketSummary[],
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  };
  if (!payload || typeof payload !== "object") return empty;
  const root = payload as Record<string, unknown>;
  const data = root.data;

  if (Array.isArray(data)) {
    return {
      items: data as SupportTicketSummary[],
      currentPage: 1,
      lastPage: 1,
      total: data.length,
      perPage: data.length || 20,
    };
  }

  if (data && typeof data === "object" && "data" in data) {
    const pag = data as {
      data: SupportTicketSummary[];
      current_page?: number;
      last_page?: number;
      total?: number;
      per_page?: number;
    };
    if (Array.isArray(pag.data)) {
      return {
        items: pag.data,
        currentPage: pag.current_page ?? 1,
        lastPage: pag.last_page ?? 1,
        total: pag.total ?? pag.data.length,
        perPage: pag.per_page ?? 20,
      };
    }
  }

  return empty;
}

export function unwrapSupportTicketDetail(
  payload: unknown
): SupportTicketDetail | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== "object") return null;

  const d = data as Record<string, unknown>;
  const rawMessages = Array.isArray(d.messages) ? d.messages : [];

  const messages: SupportTicketMessage[] = rawMessages
    .map((item, msgIndex) => normalizeSupportMessage(item, msgIndex))
    .filter((m): m is SupportTicketMessage => m !== null);

  return {
    ...(d as unknown as SupportTicketDetail),
    messages,
  };
}

function normalizeSupportMessage(
  raw: unknown,
  msgIndex: number
): SupportTicketMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const id =
    toNumber(r.id) ??
    toNumber(r.message_id) ??
    toNumber(r.support_ticket_message_id) ??
    msgIndex + 1;

  const createdAt =
    toStringOrUndefined(r.created_at) ??
    toStringOrUndefined(r.createdAt) ??
    new Date().toISOString();

  const body =
    toStringOrUndefined(r.body) ??
    toStringOrUndefined(r.message) ??
    toStringOrUndefined(r.content) ??
    null;

  const rawAttachments = Array.isArray(r.attachments)
    ? r.attachments
    : Array.isArray(r.files)
      ? r.files
      : Array.isArray(r.images)
        ? r.images
        : Array.isArray(r.message_attachments)
          ? r.message_attachments
          : [];

  const attachments: SupportMessageAttachment[] = rawAttachments
    .map((a, i) => normalizeSupportAttachment(a, i))
    .filter((a): a is SupportMessageAttachment => a !== null);

  const authorRaw =
    r.author && typeof r.author === "object"
      ? (r.author as Record<string, unknown>)
      : r.user && typeof r.user === "object"
        ? (r.user as Record<string, unknown>)
        : null;

  const author: SupportMessageAuthor | undefined = authorRaw
    ? {
        id: toNumber(authorRaw.id) ?? 0,
        name: toStringOrUndefined(authorRaw.name),
        email: toStringOrUndefined(authorRaw.email),
        is_staff:
          toBoolean(authorRaw.is_staff) ??
          toBoolean(authorRaw.isStaff) ??
          toBoolean(authorRaw.staff) ??
          false,
      }
    : undefined;

  return {
    id,
    body,
    created_at: createdAt,
    author,
    attachments,
  };
}

function normalizeSupportAttachment(
  raw: unknown,
  index: number
): SupportMessageAttachment | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const url =
    toStringOrUndefined(r.url) ??
    toStringOrUndefined(r.download_url) ??
    toStringOrUndefined(r.file_url) ??
    toStringOrUndefined(r.path);

  const idFromUrl =
    typeof url === "string"
      ? Number(url.match(/\/attachments\/(\d+)/)?.[1] ?? "")
      : NaN;

  const id =
    toNumber(r.id) ??
    toNumber(r.attachment_id) ??
    toNumber(r.attachmentId) ??
    (Number.isFinite(idFromUrl) ? idFromUrl : index + 1);

  return {
    id,
    original_name:
      toStringOrUndefined(r.original_name) ??
      toStringOrUndefined(r.name) ??
      toStringOrUndefined(r.filename),
    mime: toStringOrUndefined(r.mime) ?? toStringOrUndefined(r.mime_type),
    size: toNumber(r.size) ?? undefined,
    url: url ?? "",
  };
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function toStringOrUndefined(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function toBoolean(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
  }
  return undefined;
}

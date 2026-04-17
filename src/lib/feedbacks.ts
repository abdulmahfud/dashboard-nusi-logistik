import type { FeedbackRecord } from "@/types/feedback";

export function normalizeFeedbacksList(payload: unknown): {
  items: FeedbackRecord[];
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
} {
  const empty = {
    items: [] as FeedbackRecord[],
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  };
  if (!payload || typeof payload !== "object") return empty;
  const root = payload as Record<string, unknown>;
  const data = root.data;

  if (Array.isArray(data)) {
    return {
      items: data as FeedbackRecord[],
      currentPage: 1,
      lastPage: 1,
      total: data.length,
      perPage: data.length || 15,
    };
  }

  if (data && typeof data === "object" && "data" in data) {
    const pag = data as {
      data: FeedbackRecord[];
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
        perPage: pag.per_page ?? 15,
      };
    }
  }

  return empty;
}

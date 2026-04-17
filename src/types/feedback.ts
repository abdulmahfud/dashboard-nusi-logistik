/** Rating 1–5 sesuai UI: Jelek … Keren */
export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface FeedbackUserRef {
  id?: number;
  name?: string;
  email?: string;
}

export interface FeedbackRecord {
  id?: number;
  user_id?: number;
  rating?: number;
  comment?: string;
  user?: FeedbackUserRef | null;
  created_at?: string;
  updated_at?: string;
}

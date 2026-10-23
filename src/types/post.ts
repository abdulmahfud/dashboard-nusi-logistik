// Blog: Post & Kategori — lihat docs/be-fe/feature-post-kategori-blog.md

export interface PostCategory {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface PostAuthor {
  id: number;
  name: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  category?: PostCategory | null;
  user_id: number;
  user?: PostAuthor | null;
  /** Nama file saja — jangan dipakai langsung, pakai `image_url`. */
  image: string;
  /** URL publik lengkap, sudah jadi (lihat Post::getImageUrlAttribute() di BE). */
  image_url: string | null;
  content: string;
  created_at?: string;
  updated_at?: string;
}

/** Paginator Laravel bawaan (bukan dibungkus {data, meta} seperti resource lain). */
export interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Envelope resource Post/Category pakai `success`, bukan `status` seperti
// kebanyakan controller admin lain — lihat catatan di docs/be-fe.
export interface PostCategoryListResponse {
  success: boolean;
  message?: string;
  data: LaravelPaginator<PostCategory>;
}

export interface PostCategoryAllResponse {
  success: boolean;
  message?: string;
  data: PostCategory[];
}

export interface PostCategoryDetailResponse {
  success: boolean;
  message?: string;
  data: PostCategory | null;
}

export interface BlogPostListResponse {
  success: boolean;
  message?: string;
  data: LaravelPaginator<BlogPost>;
}

export interface BlogPostDetailResponse {
  success: boolean;
  message?: string;
  data: BlogPost | null;
}

/** GET /public/posts_home — publik, tanpa auth, untuk widget beranda. */
export interface HomePostsResponse {
  success: boolean;
  message?: string;
  data: BlogPost[];
}

/**
 * Kontrak payload notifikasi bell - setiap jenis notifikasi baru di BE
 * (app/Notifications/*) mengembalikan bentuk yang sama lewat toArray(),
 * jadi tipe ini (dan seluruh UI bell) tidak pernah perlu berubah saat ada
 * jenis notifikasi baru ditambahkan - itulah pola adapter-nya.
 */
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  /** Kunci ikon bebas (mis. "wallet", "shipment") - lihat src/lib/notificationUi.ts untuk pemetaan ke ikon. */
  icon: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsPaginator {
  data: AppNotification[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface NotificationsListResponse {
  success?: boolean;
  data?: NotificationsPaginator;
  message?: string;
}

export interface UnreadNotificationCountResponse {
  success?: boolean;
  data?: { count: number };
  message?: string;
}

export interface NotificationDetailResponse {
  success?: boolean;
  data?: AppNotification;
  message?: string;
}

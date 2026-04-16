"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserData } from "@/types/api";
import { fetchAdminMe, type AdminMeErrorKind } from "@/lib/admin-me";

type AuthContextType = {
  user: UserData | null;
  loading: boolean;
  /** Klasifikasi error terakhir GET /admin/me (403 sering dipakai untuk email belum verifikasi). */
  meErrorKind: AdminMeErrorKind;
  /** Paksa fetch baru dari API (setelah login, update profil, dll.) */
  refreshUser: (options?: { force?: boolean }) => Promise<UserData | null>;
  isVerified: boolean;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  meErrorKind: "none",
  refreshUser: async () => null,
  isVerified: false,
  hasPermission: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [meErrorKind, setMeErrorKind] = useState<AdminMeErrorKind>("none");

  const refreshUser = useCallback(async (options?: { force?: boolean }) => {
    setLoading(true);
    try {
      // default: jangan force (hindari spam /me)
      const { user: u, errorKind } = await fetchAdminMe({
        force: options?.force ?? false,
      });
      setUser(u);
      setMeErrorKind(errorKind);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const { user: u, errorKind } = await fetchAdminMe({ force: false });
      setUser(u);
      setMeErrorKind(errorKind);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const isVerified = !!user?.email_verified_at;

  const hasPermission = useCallback((permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        meErrorKind,
        refreshUser,
        isVerified,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

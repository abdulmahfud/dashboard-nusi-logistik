"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserData, ApiResponse } from "@/types/api";
import apiClient from "@/lib/apiClient";

function normalizePermissions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((p): p is string => typeof p === "string");
  }
  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>).filter(
      (p): p is string => typeof p === "string"
    );
  }
  return [];
}

function normalizeRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((r) => String(r)).filter(Boolean);
  }
  return [];
}

type AuthContextType = {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  isVerified: boolean;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  isVerified: false,
  hasPermission: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<UserData>>("/admin/me");
      const raw = res.data.data;
      setUser({
        ...raw,
        permissions: normalizePermissions(raw.permissions),
        roles: normalizeRoles(raw.roles),
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const isVerified = !!user?.email_verified_at;

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser: fetchUser,
        isVerified,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

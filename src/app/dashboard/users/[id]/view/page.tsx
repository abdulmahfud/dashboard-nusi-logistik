"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatusBadge } from "@/components/redesign/status-badge";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Edit,
  Loader2,
  Mail,
  Settings,
  Shield,
  ShieldCheck,
  User as UserIcon,
  UserCog,
  XCircle,
} from "lucide-react";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { toast } from "sonner";
import { getUserById } from "@/lib/apiClient";
import { User } from "@/types/users";

import { useAuth } from "@/context/AuthContext";

const LONG_DATE_TIME: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function formatLong(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", LONG_DATE_TIME);
}

function ShellHeader() {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1">
        <SiteHeader />
      </div>
      <TopNav />
    </div>
  );
}

function ActionRow({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    </button>
  );
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);
  const { hasPermission, loading: authLoading } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await getUserById(userId);
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Gagal memuat data pengguna");
      router.push("/dashboard/users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !hasPermission("roles.index")) {
      router.replace("/dashboard");
    }
    }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (authLoading) return null;
  if (!hasPermission("roles.index")) return null;

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <ShellHeader />
          <div className="flex flex-1 items-center justify-center gap-2 bg-blue-50/80 p-8 text-slate-600">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            Memuat data pengguna...
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!user) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <ShellHeader />
          <div className="flex flex-1 items-center justify-center bg-blue-50/80 p-8">
            <div className="text-center">
              <XCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
              <h2 className="text-xl font-semibold text-slate-900">
                Pengguna tidak ditemukan
              </h2>
              <p className="mt-2 text-slate-600">
                Pengguna dengan ID {userId} tidak dapat ditemukan.
              </p>
              <Button
                onClick={() => router.push("/dashboard/users")}
                className="mt-4 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Daftar User
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const isVerified = user.email_verified_at !== null;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <ShellHeader />

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "List User", href: "/dashboard/users" },
              { label: "Detail Pengguna" },
            ]}
            icon={UserCog}
            title="Detail Pengguna"
            description="Informasi lengkap pengguna"
            action={
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
                className="h-10 gap-2 rounded-lg border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                <Edit className="h-4 w-4" aria-hidden />
                Edit Pengguna
              </Button>
            }
          />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {/* Main User Info */}
            <div className="space-y-6 lg:col-span-2">
              <SectionCard icon={UserIcon} title="Informasi Pribadi">
                <div>
                  <p className="text-sm text-slate-500">Nama Lengkap</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {user.name}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Mail
                      className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="mt-0.5 break-all font-semibold text-slate-900">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconBrandWhatsapp
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm text-slate-500">WhatsApp</p>
                      <p className="mt-0.5 font-semibold tabular-nums text-slate-900">
                        {user.whatsapp || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={Shield} title="Role">
                <div className="flex flex-wrap gap-2">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                      >
                        {role.name.toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <p className="italic text-slate-500">
                      Tidak ada role yang ditetapkan
                    </p>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <SectionCard icon={ShieldCheck} title="Status Akun">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    Status Email
                  </span>
                  <StatusBadge
                    status={isVerified ? "success" : "pending"}
                    label={isVerified ? "Terverifikasi" : "Belum Verifikasi"}
                  />
                </div>

                {isVerified && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">Tanggal Verifikasi</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatLong(user.email_verified_at!)}
                    </p>
                  </div>
                )}
              </SectionCard>

              <SectionCard icon={Calendar} title="Timeline">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Tanggal Bergabung</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatLong(user.created_at)}
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">Terakhir Diperbarui</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatLong(user.updated_at)}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={Settings} title="Quick Actions">
                <div className="space-y-3">
                  <ActionRow
                    icon={Edit}
                    title="Edit Pengguna"
                    description="Ubah informasi pengguna"
                    onClick={() =>
                      router.push(`/dashboard/users/${user.id}/edit`)
                    }
                  />
                  <ActionRow
                    icon={Mail}
                    title="Kirim Email"
                    description="Buka aplikasi email"
                    onClick={() =>
                      window.open(`mailto:${user.email}`, "_blank")
                    }
                  />
                  <ActionRow
                    icon={IconBrandWhatsapp}
                    title="WhatsApp"
                    description="Chat melalui WhatsApp"
                    onClick={() =>
                      window.open(`https://wa.me/${user.whatsapp}`, "_blank")
                    }
                  />
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

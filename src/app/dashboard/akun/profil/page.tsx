"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatusBadge } from "@/components/redesign/status-badge";
import {
  ArrowLeft,
  Edit,
  Landmark,
  Mail,
  Phone,
  Settings,
  User as UserIcon,
  UserCog,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/users";

export default function UserProfilePage() {
  const router = useRouter();
  const { user: authUser, loading } = useAuth();

  // Convert AuthContext user to User type for compatibility
  const user: User | null = authUser
    ? {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      whatsapp: authUser.whatsapp || "",
      email_verified_at: authUser.email_verified_at,
      created_at: authUser.created_at || "",
      updated_at: authUser.updated_at || "",
      roles: [], // AuthContext doesn't include roles, but that's ok for profile
    }
    : null;

  useEffect(() => {
    if (!loading && !authUser) {
      toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/login");
    }
  }, [loading, authUser, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          Memuat data profil...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            Gagal memuat profil
          </h2>
          <p className="text-gray-600 mt-2">
            Terjadi kesalahan saat memuat data profil Anda.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isVerified = user.email_verified_at !== null;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Profil" },
            ]}
            icon={UserCog}
            title="Profil"
            description="Informasi pribadi Anda."
            action={
              <Button
                onClick={() => router.push(`/dashboard/akun/profil/edit`)}
                className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4" aria-hidden />
                Edit Profil
              </Button>
            }
          />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {/* Main User Info */}
            <div className="lg:col-span-2">
              <SectionCard icon={UserIcon} title="Informasi Pribadi">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Nama Lengkap
                    </p>
                    <p className="text-lg font-medium text-slate-900">
                      {user.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="flex items-center gap-1 text-sm font-medium text-slate-500">
                        <Mail className="h-4 w-4" aria-hidden />
                        Email
                      </p>
                      <p className="text-lg text-slate-900">{user.email}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-sm font-medium text-slate-500">
                        <Phone className="h-4 w-4" aria-hidden />
                        WhatsApp
                      </p>
                      <p className="font-mono text-lg text-slate-900">
                        {user.whatsapp}
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <SectionCard icon={UserCog} title="Status Akun">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Status Email
                    </span>
                    <StatusBadge
                      status={isVerified ? "success" : "pending"}
                      label={isVerified ? "Terverifikasi" : "Belum Verifikasi"}
                    />
                  </div>

                  {isVerified && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Tanggal Verifikasi
                      </p>
                      <p className="text-sm text-slate-900">
                        {new Date(user.email_verified_at!).toLocaleDateString(
                          "id-ID",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard icon={Settings} title="Pengaturan">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-start gap-2 rounded-lg border-slate-200"
                    onClick={() => router.push(`/dashboard/akun/profil/edit`)}
                  >
                    <Edit className="h-4 w-4" aria-hidden />
                    Edit Profil
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-start gap-2 rounded-lg border-slate-200"
                    onClick={() => router.push(`/dashboard/akun/rekening`)}
                  >
                    <Landmark className="h-4 w-4" aria-hidden />
                    Rekening Bank
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-start gap-2 rounded-lg border-slate-200"
                    onClick={() => router.push(`/dashboard/akun/social-media`)}
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    Social Media
                  </Button>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

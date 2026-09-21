"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import {
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Shield,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { createUser, getAllRoles } from "@/lib/apiClient";
import { UserCreateRequest } from "@/types/users";
import { SimpleRole } from "@/types/roles";

import { useAuth } from "@/context/AuthContext";

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState<SimpleRole[]>([]);
  const { user, hasPermission, loading: authLoading } = useAuth();
  const isSuperAdmin = user?.roles?.includes("superadmin") ?? false;

  const [formData, setFormData] = useState<UserCreateRequest>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    whatsapp: "",
    roles: ["user"], // Default to user role
  });

  const fetchRoles = async () => {
    try {
      const response = await getAllRoles();
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Gagal memuat data roles");
    }
  };

  useEffect(() => {
    if (!authLoading && !hasPermission("roles.index")) {
      router.replace("/dashboard");
    }
    }, [authLoading, hasPermission, router]);

  useEffect(() => {
    // Role picker hanya untuk superadmin — BE mengabaikan field `roles`
    // kalau requester bukan superadmin (default jadi "user"), jadi tidak
    // perlu ambil daftar role untuk role lain.
    if (isSuperAdmin) {
      fetchRoles();
    }
  }, [isSuperAdmin]);

  const handleInputChange = (field: keyof UserCreateRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRoleChange = (selectedRole: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: [selectedRole],
    }));
  };

  const validateForm = () => {
    // Name validation
    if (!formData.name.trim()) {
      toast.error("Nama harus diisi");
      return false;
    }

    if (formData.name.length > 255) {
      toast.error("Nama maksimal 255 karakter");
      return false;
    }

    // Email validation
    if (!formData.email.trim()) {
      toast.error("Email harus diisi");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Format email tidak valid");
      return false;
    }

    if (formData.email.length > 255) {
      toast.error("Email maksimal 255 karakter");
      return false;
    }

    // Password validation
    if (!formData.password) {
      toast.error("Password harus diisi");
      return false;
    }

    if (formData.password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return false;
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error("Konfirmasi password tidak cocok");
      return false;
    }

    // WhatsApp validation
    if (!formData.whatsapp.trim()) {
      toast.error("Nomor WhatsApp harus diisi");
      return false;
    }

    if (formData.whatsapp.length > 15) {
      toast.error("Nomor WhatsApp maksimal 15 karakter");
      return false;
    }

    // WhatsApp format validation (angka, +, -, spasi, kurung)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(formData.whatsapp)) {
      toast.error(
        "Format nomor WhatsApp tidak valid (hanya angka, +, -, spasi, dan kurung yang diperbolehkan)"
      );
      return false;
    }

    // Basic Indonesian phone number validation
    const cleanWhatsapp = formData.whatsapp.replace(/[\s\-()]/g, "");
    if (
      !cleanWhatsapp.startsWith("08") &&
      !cleanWhatsapp.startsWith("+62") &&
      !cleanWhatsapp.startsWith("62")
    ) {
      toast.error("Nomor WhatsApp harus dimulai dengan 08, +62, atau 62");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      // BE hanya memproses `roles` kalau requester superadmin — jangan kirim
      // untuk menghindari kesan role terpilih benar-benar tersimpan.
      const payload = isSuperAdmin
        ? formData
        : { ...formData, roles: undefined };
      await createUser(payload);
      toast.success("Pengguna berhasil dibuat");
      router.push("/dashboard/users");
    } catch (error: unknown) {
      console.error("Error creating user:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: { errors?: Record<string, string[]>; message?: string };
          };
        };
        if (axiosError.response?.data?.errors) {
          const errors = axiosError.response.data.errors;
          Object.keys(errors).forEach((key) => {
            errors[key].forEach((message: string) => {
              toast.error(`${key}: ${message}`);
            });
          });
        } else {
          toast.error(
            axiosError.response?.data?.message || "Gagal membuat pengguna"
          );
        }
      } else {
        toast.error("Gagal membuat pengguna");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;
  if (!hasPermission("roles.index")) return null;

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
              { label: "Tambah User" },
            ]}
            icon={UserPlus}
            title="Tambah Pengguna Baru"
            description="Buat akun pengguna baru untuk sistem"
            illustration="/images/incorporation.png"
            illustrationClassName="w-[120px]"
          />

          <SectionCard icon={ClipboardList} title="Form Pengguna Baru">
            <form onSubmit={handleSubmit} className="space-y-6 border-t border-slate-100 pt-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-800">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      required
                      className="h-11 rounded-lg border-slate-200 bg-white pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-800">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="contoh@email.com"
                      required
                      className="h-11 rounded-lg border-slate-200 bg-white pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm font-medium text-slate-800">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MessageCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <Input
                    id="whatsapp"
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      handleInputChange("whatsapp", e.target.value)
                    }
                    placeholder="08xxxxxxxxx atau +62xxxxxxxxx"
                    required
                    className="h-11 rounded-lg border-slate-200 bg-white pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Format: 08xxxxxxxxx, +62xxxxxxxxx, atau 62xxxxxxxxx (maksimal
                  15 karakter)
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-800">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="Minimal 8 karakter"
                      required
                      className="h-11 rounded-lg border-slate-200 bg-white pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation" className="text-sm font-medium text-slate-800">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <Input
                      id="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.password_confirmation}
                      onChange={(e) =>
                        handleInputChange(
                          "password_confirmation",
                          e.target.value
                        )
                      }
                      placeholder="Ulangi password"
                      required
                      className="h-11 rounded-lg border-slate-200 bg-white pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={
                        showConfirmPassword
                          ? "Sembunyikan konfirmasi password"
                          : "Tampilkan konfirmasi password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {isSuperAdmin ? (
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-slate-800">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Shield
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10"
                      aria-hidden
                    />
                    <Select
                      value={(formData.roles && formData.roles[0]) || "user"}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger
                        id="role"
                        className="h-11 rounded-lg border-slate-200 bg-white pl-10"
                      >
                        <SelectValue placeholder="Pilih role pengguna" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-slate-500">
                    Tentukan level akses pengguna dalam sistem
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-800">Role</Label>
                  <p className="text-sm text-slate-700">
                    Pengguna baru otomatis mendapat role{" "}
                    <span className="font-medium">user</span>.
                  </p>
                  <p className="text-xs text-slate-500">
                    Hanya superadmin yang bisa menentukan role staff
                    (finance/sales/operations/customer-service) saat membuat
                    pengguna.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-lg border-slate-200 px-6"
                  onClick={() => router.push("/dashboard/users")}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" aria-hidden />
                      Buat Pengguna
                    </>
                  )}
                </Button>
              </div>
            </form>
          </SectionCard>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">Catatan:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Semua field dengan tanda (*) wajib diisi</li>
              <li>• Nama maksimal 255 karakter</li>
              <li>
                • Email harus unik, maksimal 255 karakter, dan belum terdaftar
              </li>
              <li>• Password minimal 8 karakter</li>
              <li>
                • Nomor WhatsApp maksimal 15 karakter, harus unik, dan dimulai
                dengan 08/+62/62
              </li>
              <li>
                • Format WhatsApp yang valid: 08xxxxxxxxx, +62xxxxxxxxx, atau
                62xxxxxxxxx
              </li>
              <li>
                • Pengguna baru perlu verifikasi email setelah pendaftaran
              </li>
            </ul>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

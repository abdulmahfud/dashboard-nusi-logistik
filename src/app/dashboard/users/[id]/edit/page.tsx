"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import {
  ArrowLeft,
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Save,
  Shield,
  User as UserIcon,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { getUserById, updateUser, getAllRoles } from "@/lib/apiClient";
import { User, UserUpdateRequest } from "@/types/users";
import { SimpleRole } from "@/types/roles";

import { useAuth } from "@/context/AuthContext";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);
  const { user: currentUser, hasPermission, loading: authLoading } = useAuth();
  const isSuperAdmin = currentUser?.roles?.includes("superadmin") ?? false;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [roles, setRoles] = useState<SimpleRole[]>([]);
  const [formData, setFormData] = useState<UserUpdateRequest>({
    name: "",
    email: "",
    whatsapp: "",
    password: "",
    password_confirmation: "",
    role: "",
  });

  const fetchUser = async () => {
    try {
      setLoading(true);
      // Role picker hanya untuk superadmin — BE mengabaikan field `role`
      // kalau requester bukan superadmin, jadi tidak perlu daftar role lain.
      const [userResponse, rolesResponse] = await Promise.all([
        getUserById(userId),
        isSuperAdmin ? getAllRoles() : Promise.resolve(null),
      ]);

      const userData = userResponse.data;
      setUser(userData);
      if (rolesResponse) setRoles(rolesResponse.data);

      setFormData({
        name: userData.name,
        email: userData.email,
        whatsapp: userData.whatsapp,
        password: "",
        password_confirmation: "",
        role: userData.roles.length > 0 ? userData.roles[0].name : "user",
      });
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
    if (userId && !authLoading) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading, isSuperAdmin]);

  const handleInputChange = (field: keyof UserUpdateRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Nama harus diisi");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Email harus diisi");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Format email tidak valid");
      return false;
    }

    if (!formData.whatsapp.trim()) {
      toast.error("Nomor WhatsApp harus diisi");
      return false;
    }

    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(formData.whatsapp)) {
      toast.error("Format nomor WhatsApp tidak valid");
      return false;
    }

    if (changePassword) {
      if (!formData.password) {
        toast.error("Password baru harus diisi");
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
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const updateData: UserUpdateRequest = {
        name: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        // BE hanya memproses `role` kalau requester superadmin — jangan
        // kirim untuk menghindari kesan role terpilih benar-benar tersimpan.
        ...(isSuperAdmin ? { role: formData.role } : {}),
      };

      if (changePassword && formData.password) {
        updateData.password = formData.password;
        updateData.password_confirmation = formData.password_confirmation;
      }

      await updateUser(userId, updateData);
      toast.success("Data pengguna berhasil diperbarui");
      router.push(`/dashboard/users/${userId}/view`);
    } catch (error: unknown) {
      console.error("Error updating user:", error);

      const res = (
        error as {
          response?: {
            status?: number;
            data?: { errors?: Record<string, string[]>; message?: string };
          };
        }
      )?.response;
      const data = res?.data;
      const taken = /taken|already|sudah|duplicate|unique|exists/i;
      const fieldLabel: Record<string, string> = {
        whatsapp: "Nomor WhatsApp",
        email: "Email",
        name: "Nama",
        password: "Password",
        role: "Role",
      };
      const nextErrors: Record<string, string> = {};

      if (data?.errors) {
        Object.entries(data.errors).forEach(([key, messages]) => {
          const label = fieldLabel[key] ?? key;
          const msg = messages[0] ?? "";
          nextErrors[key] = taken.test(msg)
            ? `${label} sudah digunakan pengguna lain.`
            : msg;
        });
      } else if (data?.message && taken.test(data.message)) {
        // Mis. error unique dari DB (409/500) tanpa detail field.
        const key = /whatsapp/i.test(data.message)
          ? "whatsapp"
          : /email/i.test(data.message)
            ? "email"
            : null;
        if (key) {
          nextErrors[key] = `${fieldLabel[key]} sudah digunakan pengguna lain.`;
        }
      }

      setFieldErrors(nextErrors);
      const messages = Object.values(nextErrors);
      if (messages.length > 0) {
        messages.forEach((m) => toast.error(m));
      } else {
        toast.error(data?.message || "Gagal memperbarui data pengguna");
      }
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;
  if (!hasPermission("roles.index")) return null;

  const shellHeader = (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1">
        <SiteHeader />
      </div>
      <TopNav />
    </div>
  );

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          {shellHeader}
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
          {shellHeader}
          <div className="flex flex-1 items-center justify-center bg-blue-50/80 p-8">
            <div className="text-center">
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

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        {shellHeader}

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "List User", href: "/dashboard/users" },
              { label: "Edit Pengguna" },
            ]}
            icon={UserCheck}
            title="Edit Pengguna"
            description={`Perbarui informasi pengguna ${user.name}`}
          />

          <SectionCard icon={ClipboardList} title="Form Edit Pengguna">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 border-t border-slate-100 pt-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-800">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
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
                      aria-invalid={Boolean(fieldErrors.email)}
                      className={`h-11 rounded-lg bg-white pl-10 ${
                        fieldErrors.email
                          ? "border-red-500"
                          : "border-slate-200"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600" role="alert">
                      {fieldErrors.email}
                    </p>
                  )}
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
                    aria-invalid={Boolean(fieldErrors.whatsapp)}
                    className={`h-11 rounded-lg bg-white pl-10 ${
                      fieldErrors.whatsapp
                        ? "border-red-500"
                        : "border-slate-200"
                    }`}
                  />
                </div>
                {fieldErrors.whatsapp ? (
                  <p className="text-xs text-red-600" role="alert">
                    {fieldErrors.whatsapp}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Format: 08xxxxxxxxx atau +62xxxxxxxxx
                  </p>
                )}
              </div>

              {isSuperAdmin ? (
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-slate-800">
                    Role
                  </Label>
                  <div className="relative">
                    <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" aria-hidden />
                    <Select
                      value={formData.role || "user"}
                      onValueChange={(value) =>
                        handleInputChange("role", value)
                      }
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
                    {formData.role || "user"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Hanya superadmin yang bisa mengubah role staff
                    (finance/sales/operations/customer-service).
                  </p>
                </div>
              )}

              <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="changePassword"
                    className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                    checked={changePassword}
                    onCheckedChange={(checked) =>
                      setChangePassword(
                        checked === "indeterminate" ? false : checked
                      )
                    }
                  />
                  <Label
                    htmlFor="changePassword"
                    className="cursor-pointer font-medium text-slate-800"
                  >
                    Ubah Password
                  </Label>
                </div>

                {changePassword && (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-800">
                        Password Baru <span className="text-red-500">*</span>
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
                          required={changePassword}
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
                      <Label
                        htmlFor="password_confirmation"
                        className="text-sm font-medium text-slate-800"
                      >
                        Konfirmasi Password Baru{" "}
                        <span className="text-red-500">*</span>
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
                          placeholder="Ulangi password baru"
                          required={changePassword}
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
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-lg border-slate-200 px-6"
                  onClick={() => router.push(`/dashboard/users/${userId}/view`)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" aria-hidden />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </SectionCard>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <h3 className="mb-2 font-semibold text-amber-900">Perhatian:</h3>
            <ul className="space-y-1 text-sm text-amber-800">
              <li>• Perubahan email akan memerlukan verifikasi ulang</li>
              <li>• Jika mengubah password, pengguna harus login ulang</li>
              <li>• Perubahan role akan mempengaruhi hak akses pengguna</li>
              <li>• Semua perubahan akan tersimpan secara permanen</li>
            </ul>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

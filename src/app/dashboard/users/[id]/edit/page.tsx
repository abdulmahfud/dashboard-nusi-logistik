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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Eye, EyeOff, UserCheck } from "lucide-react";
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
            axiosError.response?.data?.message ||
              "Gagal memperbarui data pengguna"
          );
        }
      } else {
        toast.error("Gagal memperbarui data pengguna");
      }
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;
  if (!hasPermission("roles.index")) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          Memuat data pengguna...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Pengguna tidak ditemukan
          </h2>
          <p className="text-gray-600 mt-2">
            Pengguna dengan ID {userId} tidak dapat ditemukan.
          </p>
          <Button
            onClick={() => router.push("/dashboard/users")}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar User
          </Button>
        </div>
      </div>
    );
  }

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

        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/users/${userId}/view`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Pengguna</h1>
              <p className="text-gray-600">
                Perbarui informasi pengguna {user.name}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Form Edit Pengguna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="contoh@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Nomor WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      handleInputChange("whatsapp", e.target.value)
                    }
                    placeholder="08xxxxxxxxx atau +62xxxxxxxxx"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Format: 08xxxxxxxxx atau +62xxxxxxxxx
                  </p>
                </div>

                {isSuperAdmin ? (
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role || "user"}
                      onValueChange={(value) =>
                        handleInputChange("role", value)
                      }
                    >
                      <SelectTrigger>
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
                    <p className="text-xs text-gray-500">
                      Tentukan level akses pengguna dalam sistem
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <p className="text-sm text-gray-700">
                      {formData.role || "user"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Hanya superadmin yang bisa mengubah role staff
                      (finance/sales/operations/customer-service).
                    </p>
                  </div>
                )}

                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="changePassword"
                      checked={changePassword}
                      onCheckedChange={(checked) =>
                        setChangePassword(
                          checked === "indeterminate" ? false : checked
                        )
                      }
                    />
                    <Label htmlFor="changePassword" className="font-medium">
                      Ubah Password
                    </Label>
                  </div>

                  {changePassword && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password Baru *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) =>
                              handleInputChange("password", e.target.value)
                            }
                            placeholder="Minimal 8 karakter"
                            required={changePassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password_confirmation">
                          Konfirmasi Password Baru *
                        </Label>
                        <div className="relative">
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
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(`/dashboard/users/${userId}/view`)
                    }
                    disabled={saving}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:bg-blue-700 hover:text-white"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">Perhatian:</h3>
            <ul className="text-sm text-amber-800 space-y-1">
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

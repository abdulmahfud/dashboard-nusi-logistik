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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Eye, EyeOff } from "lucide-react";
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
  const { hasPermission, loading: authLoading } = useAuth();

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
    fetchRoles();
  }, []);

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
      await createUser(formData);
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
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/users")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Tambah Pengguna Baru</h1>
              <p className="text-gray-600">
                Buat akun pengguna baru untuk sistem
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Form Pengguna Baru
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
                    Format: 08xxxxxxxxx, +62xxxxxxxxx, atau 62xxxxxxxxx
                    (maksimal 15 karakter)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        placeholder="Minimal 8 karakter"
                        required
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
                      Konfirmasi Password *
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
                        placeholder="Ulangi password"
                        required
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

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={(formData.roles && formData.roles[0]) || "user"}
                    onValueChange={handleRoleChange}
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

                <div className="flex justify-end gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/users")}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Membuat...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Buat Pengguna
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Catatan:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
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

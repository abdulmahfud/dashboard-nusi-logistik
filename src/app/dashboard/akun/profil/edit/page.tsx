"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  UserRound,
  HelpCircle,
  Mail,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  getCurrentUser,
  updateUser,
  resendEmailVerification,
} from "@/lib/apiClient";
import type { User, UserUpdateRequest } from "@/types/users";
import { AxiosError } from "axios";

function ProfileEditSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-72" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, refreshUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const [formData, setFormData] = useState<UserUpdateRequest>({
    name: "",
    email: "",
    whatsapp: "",
    password: "",
    password_confirmation: "",
    role: "",
  });

  const loadProfile = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await getCurrentUser();
      const u = res.data;
      setProfile(u);
      setFormData({
        name: u.name,
        email: u.email,
        whatsapp: u.whatsapp ?? "",
        password: "",
        password_confirmation: "",
        role: u.roles?.length ? u.roles[0].name : "user",
      });
    } catch (e) {
      console.error(e);
      setLoadError(
        "Tidak dapat memuat profil. Periksa koneksi atau coba lagi."
      );
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) {
      toast.error("Sesi berakhir. Silakan login kembali.");
      router.push("/login");
      return;
    }
    if (authUser) {
      void loadProfile();
    }
  }, [authLoading, authUser, router, loadProfile]);

  const handleInputChange = (field: keyof UserUpdateRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (!profile || !validateForm()) return;

    setSaving(true);
    try {
      const updateData: UserUpdateRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        whatsapp: formData.whatsapp.trim(),
        role: formData.role || "user",
      };
      if (changePassword && formData.password) {
        updateData.password = formData.password;
        updateData.password_confirmation = formData.password_confirmation;
      }

      await updateUser(profile.id, updateData);
      toast.success("Profil berhasil diperbarui");
      await refreshUser();
      router.push("/dashboard/akun/profil");
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as {
          errors?: Record<string, string[]>;
          message?: string;
        };
        if (data.errors) {
          Object.entries(data.errors).forEach(([key, messages]) => {
            messages.forEach((m) => toast.error(`${key}: ${m}`));
          });
        } else {
          toast.error(data.message || "Gagal menyimpan profil");
        }
      } else {
        toast.error("Gagal menyimpan profil");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await resendEmailVerification();
      toast.success("Email verifikasi dikirim. Periksa kotak masuk Anda.");
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data) {
        const msg =
          (error.response.data as { message?: string }).message ||
          "Gagal mengirim ulang email";
        toast.error(msg);
      } else {
        toast.error("Gagal mengirim ulang email verifikasi");
      }
    } finally {
      setResending(false);
    }
  };

  if (authLoading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex w-full items-center justify-between">
            <div className="flex-1">
              <SiteHeader />
            </div>
            <TopNav />
          </div>
          <ProfileEditSkeleton />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!authUser) {
    return null;
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex w-full items-center justify-between">
            <div className="flex-1">
              <SiteHeader />
            </div>
            <TopNav />
          </div>
          <ProfileEditSkeleton />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (loadError || !profile) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex w-full items-center justify-between">
            <div className="flex-1">
              <SiteHeader />
            </div>
            <TopNav />
          </div>
          <div
            className="container mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center"
            role="alert"
          >
            <AlertCircle
              className="h-14 w-14 text-destructive"
              aria-hidden
            />
            <h1 className="text-xl font-semibold">Gagal memuat profil</h1>
            <p className="text-muted-foreground text-sm">
              {loadError || "Data profil tidak tersedia."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => loadProfile()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba lagi
              </Button>
              <Button
                type="button"
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/dashboard/akun/profil")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke profil
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const isVerified = profile.email_verified_at !== null;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="container mx-auto max-w-3xl space-y-6 p-4 pb-10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <Button
                type="button"
                variant="ghost"
                className="-ml-3 mb-1 h-auto px-3 py-1 text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/dashboard/akun/profil")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">
                Edit profil
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Perbarui nama, kontak, dan kata sandi. Data disimpan melalui API
                pengguna yang sama dengan panel admin.
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2 self-start"
                >
                  <HelpCircle className="h-4 w-4" />
                  Panduan
                </Button>
              </DialogTrigger>
              <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
                  <DialogTitle>Panduan mengedit profil</DialogTitle>
                  <DialogDescription>
                    Ringkasan agar perubahan berjalan lancar.
                  </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                  <ul className="text-muted-foreground space-y-3 text-sm leading-relaxed">
                    <li>
                      • <strong className="text-foreground">Nama & WhatsApp</strong>{" "}
                      digunakan di pengiriman dan komunikasi layanan.
                    </li>
                    <li>
                      • Mengubah <strong className="text-foreground">email</strong>{" "}
                      biasanya memerlukan verifikasi ulang sesuai kebijakan server.
                    </li>
                    <li>
                      • Aktifkan &quot;Ubah password&quot; hanya jika Anda ingin
                      mengganti kata sandi login.
                    </li>
                    <li>
                      • Setelah password diubah, gunakan kredensial baru saat login
                      berikutnya.
                    </li>
                    <li>
                      • Tombol &quot;Kirim ulang verifikasi&quot; memanggil endpoint{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        POST /email/resend
                      </code>{" "}
                      (perlu sesi login).
                    </li>
                    <li>
                      • Simpan perubahan memanggil{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        PUT /admin/users/:id
                      </code>{" "}
                      dengan ID Anda dari{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        GET /admin/me
                      </code>
                      .
                    </li>
                    <li>
                      • Jika ada banyak pesan error validasi, baca tiap baris dan
                      perbaiki field yang diminta.
                    </li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!isVerified && (
            <div
              className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/40"
              role="status"
            >
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Email belum terverifikasi
                  </p>
                  <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
                    Kirim ulang tautan verifikasi ke inbox email Anda.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-amber-300 bg-white hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900"
                disabled={resending}
                onClick={() => void handleResendVerification()}
              >
                {resending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Kirim ulang verifikasi
                  </>
                )}
              </Button>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="h-5 w-5" aria-hidden />
                Data akun
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Nama lengkap</Label>
                    <Input
                      id="profile-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Nama Anda"
                      required
                      aria-required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="nama@email.com"
                      required
                      aria-required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-whatsapp">WhatsApp</Label>
                  <Input
                    id="profile-whatsapp"
                    name="whatsapp"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      handleInputChange("whatsapp", e.target.value)
                    }
                    placeholder="08xxxxxxxxxx atau +62…"
                    required
                    aria-required
                  />
                  <p className="text-muted-foreground text-xs">
                    Hanya angka, spasi, tanda + dan tanda hubung yang didukung
                    pada validasi formulir.
                  </p>
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="profile-change-password"
                      checked={changePassword}
                      onCheckedChange={(c) =>
                        setChangePassword(c === true)
                      }
                      aria-describedby="password-section-hint"
                    />
                    <div className="grid gap-1">
                      <Label
                        htmlFor="profile-change-password"
                        className="cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Ubah password
                      </Label>
                      <p
                        id="password-section-hint"
                        className="text-muted-foreground text-xs"
                      >
                        Kosongkan jika tidak ingin mengganti kata sandi.
                      </p>
                    </div>
                  </div>

                  {changePassword && (
                    <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="profile-password">Password baru</Label>
                        <div className="relative">
                          <Input
                            id="profile-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={(e) =>
                              handleInputChange("password", e.target.value)
                            }
                            placeholder="Minimal 8 karakter"
                            required={changePassword}
                            className="pr-10"
                            aria-required={changePassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword((v) => !v)}
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
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-password-confirm">
                          Konfirmasi password
                        </Label>
                        <div className="relative">
                          <Input
                            id="profile-password-confirm"
                            name="password_confirmation"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={formData.password_confirmation}
                            onChange={(e) =>
                              handleInputChange(
                                "password_confirmation",
                                e.target.value
                              )
                            }
                            placeholder="Ulangi password baru"
                            required={changePassword}
                            className="pr-10"
                            aria-required={changePassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword((v) => !v)
                            }
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
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={saving}
                    onClick={() => router.push("/dashboard/akun/profil")}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Menyimpan…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" aria-hidden />
                        Simpan perubahan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

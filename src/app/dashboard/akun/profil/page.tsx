"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatusBadge } from "@/components/redesign/status-badge";
import {
  Building2,
  Camera,
  ChevronRight,
  Edit,
  FileText,
  KeyRound,
  Landmark,
  Loader2,
  Settings,
  Share2,
  ShieldCheck,
  User as UserIcon,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import apiClient, {
  requestPasswordReset,
  updateUser,
  uploadAvatar,
  uploadKtpDocument,
  ownDocumentUrl,
} from "@/lib/apiClient";
import { AxiosError } from "axios";

const JENIS_USAHA_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  retail: "Retail",
  distributor: "Distributor",
  manufaktur: "Manufaktur",
  logistik: "Logistik",
  umkm: "UMKM",
  lainnya: "Lainnya",
};

function formatDate(value?: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" aria-hidden />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
    </button>
  );
}

export default function UserProfilePage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/login");
    }
  }, [loading, user, router]);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [sendingReset, setSendingReset] = useState(false);
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [savingPref, setSavingPref] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
          Memuat data profil...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isCorporate = user.account_type === "corporate";
  const isVerified = user.email_verified_at !== null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success("Foto profil berhasil diperbarui.");
      await refreshUser({ force: true });
    } catch (error) {
      const msg =
        error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(msg || "Gagal mengunggah foto profil.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleKtpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingKtp(true);
    try {
      await uploadKtpDocument(file);
      toast.success("Dokumen KTP berhasil diunggah.");
      await refreshUser({ force: true });
    } catch (error) {
      const msg =
        error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(msg || "Gagal mengunggah dokumen KTP.");
    } finally {
      setUploadingKtp(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setSendingReset(true);
    try {
      await requestPasswordReset(user.email);
      toast.success(
        "Link ganti kata sandi telah dikirim ke email Anda. Tautan berlaku selama 10 menit."
      );
    } catch {
      toast.error("Gagal mengirim link ganti kata sandi.");
    } finally {
      setSendingReset(false);
    }
  };

  const handleViewDocument = async (type: "ktp" | "npwp" | "nib" | "pic_ktp") => {
    setViewingDoc(type);
    try {
      const res = await apiClient.get<Blob>(ownDocumentUrl(type), {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error("Gagal membuka dokumen.");
    } finally {
      setViewingDoc(null);
    }
  };

  const handleTogglePreference = async (
    field: "notify_email" | "notify_whatsapp",
    value: boolean
  ) => {
    setSavingPref(field);
    try {
      await updateUser(user.id, {
        name: user.name,
        email: user.email,
        whatsapp: user.whatsapp,
        [field]: value,
      });
      await refreshUser({ force: true });
    } catch {
      toast.error("Gagal menyimpan preferensi.");
    } finally {
      setSavingPref(null);
    }
  };

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
            description={
              isCorporate ? "Informasi perusahaan Anda." : "Informasi pribadi Anda."
            }
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
            {/* Main info + documents */}
            <div className="space-y-6 lg:col-span-2">
              <SectionCard
                icon={isCorporate ? Building2 : UserIcon}
                title={isCorporate ? "Informasi Perusahaan" : "Informasi Pribadi"}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-20 w-20 items-center justify-center overflow-hidden bg-blue-600 text-2xl font-semibold text-white ${
                          isCorporate ? "rounded-2xl" : "rounded-full"
                        }`}
                      >
                        {user.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar_url}
                            alt="Foto profil"
                            className="h-full w-full object-cover"
                          />
                        ) : isCorporate ? (
                          <Building2 className="h-8 w-8" aria-hidden />
                        ) : (
                          (user.name?.[0] ?? "?").toUpperCase()
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-blue-600 shadow ring-1 ring-slate-200 hover:bg-blue-50"
                        aria-label="Ganti foto profil"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Camera className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={(e) => void handleAvatarChange(e)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">
                          {isCorporate ? user.company_name || user.name : user.name}
                        </p>
                        {isVerified && (
                          <StatusBadge status="approved" label="Terverifikasi" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {isCorporate ? "Akun Perusahaan" : "Akun Personal"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    {isCorporate ? (
                      <>
                        <InfoRow label="Nama Perusahaan" value={user.company_name || "-"} />
                        <InfoRow
                          label="Jenis Usaha"
                          value={
                            user.jenis_usaha
                              ? JENIS_USAHA_LABELS[user.jenis_usaha] ?? user.jenis_usaha
                              : "-"
                          }
                        />
                        <InfoRow label="NPWP" value={user.npwp || "-"} />
                        <InfoRow label="NIB" value={user.nib || "-"} />
                        <InfoRow label="Alamat Perusahaan" value={user.billing_address || "-"} />
                        <InfoRow label="Nama Penanggung Jawab" value={user.pic_name || "-"} />
                        <InfoRow label="Email Perusahaan" value={user.email} />
                        <InfoRow label="Nomor WhatsApp" value={user.whatsapp || "-"} />
                        <InfoRow label="Tanggal Bergabung" value={formatDate(user.created_at)} />
                      </>
                    ) : (
                      <>
                        <InfoRow label="Nama Lengkap" value={user.name} />
                        <InfoRow label="Email" value={user.email} />
                        <InfoRow label="Nomor WhatsApp" value={user.whatsapp || "-"} />
                        <InfoRow label="Kota Domisili" value={user.city || "-"} />
                        <InfoRow label="Tanggal Lahir" value={formatDate(user.birth_date)} />
                        <InfoRow
                          label="Jenis Kelamin"
                          value={
                            user.gender === "male"
                              ? "Laki-laki"
                              : user.gender === "female"
                              ? "Perempuan"
                              : "-"
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={FileText}
                title={isCorporate ? "Dokumen Perusahaan" : "Dokumen Identitas"}
                description={
                  isCorporate
                    ? "Kelola dokumentasi perusahaan Anda untuk keamanan akun."
                    : "Kelola dokumen identitas Anda untuk keamanan akun."
                }
              >
                <div className="space-y-2">
                  {isCorporate ? (
                    <>
                      <DocumentRow
                        label="NPWP"
                        exists={!!user.has_npwp_document}
                        verified={!!user.corporate_approved_at}
                        loading={viewingDoc === "npwp"}
                        onView={() => void handleViewDocument("npwp")}
                      />
                      <DocumentRow
                        label="NIB"
                        exists={!!user.has_nib_document}
                        verified={!!user.corporate_approved_at}
                        loading={viewingDoc === "nib"}
                        onView={() => void handleViewDocument("nib")}
                      />
                      <DocumentRow
                        label="KTP Penanggung Jawab"
                        exists={!!user.has_pic_ktp_document}
                        verified={!!user.corporate_approved_at}
                        loading={viewingDoc === "pic_ktp"}
                        onView={() => void handleViewDocument("pic_ktp")}
                      />
                    </>
                  ) : (
                    <DocumentRow
                      label="KTP"
                      exists={!!user.has_ktp_document}
                      verified={false}
                      loading={viewingDoc === "ktp" || uploadingKtp}
                      onView={() => void handleViewDocument("ktp")}
                      onUpload={() => ktpInputRef.current?.click()}
                    />
                  )}
                  <input
                    ref={ktpInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => void handleKtpChange(e)}
                  />
                </div>
              </SectionCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SectionCard icon={UserCog} title="Status Akun">
                <div className="space-y-1">
                  <InfoRow
                    label="Tipe Akun"
                    value={
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          isCorporate
                            ? "bg-violet-50 text-violet-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {isCorporate ? (
                          <Building2 className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <UserIcon className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {isCorporate ? "Perusahaan" : "Personal"}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Status Email"
                    value={
                      <StatusBadge
                        status={isVerified ? "success" : "pending"}
                        label={isVerified ? "Terverifikasi" : "Belum Verifikasi"}
                      />
                    }
                  />
                  <InfoRow
                    label="Status WhatsApp"
                    value={
                      <StatusBadge
                        status={user.whatsapp ? "success" : "pending"}
                        label={user.whatsapp ? "Terisi" : "Belum Diisi"}
                      />
                    }
                  />
                  {isVerified && (
                    <InfoRow
                      label="Tanggal Verifikasi"
                      value={formatDateTime(user.email_verified_at)}
                    />
                  )}
                </div>
              </SectionCard>

              <SectionCard icon={ShieldCheck} title="Keamanan Akun">
                <p className="mb-3 text-xs text-slate-500">
                  Jaga keamanan akun Anda dengan mengelola kata sandi.
                </p>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <KeyRound className="h-4 w-4 text-slate-400" aria-hidden />
                    Kata Sandi ********
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={sendingReset}
                    onClick={() => void handleSendPasswordReset()}
                  >
                    {sendingReset ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Ubah"
                    )}
                  </Button>
                </div>
              </SectionCard>

              <SectionCard icon={Settings} title="Preferensi" description="Atur preferensi penggunaan akun Anda.">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Notifikasi Email</p>
                      <p className="text-xs text-slate-500">
                        Terima informasi penting melalui email
                      </p>
                    </div>
                    <Switch
                      checked={user.notify_email ?? true}
                      disabled={savingPref === "notify_email"}
                      onCheckedChange={(v) => void handleTogglePreference("notify_email", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Notifikasi WhatsApp</p>
                      <p className="text-xs text-slate-500">
                        Terima update status pengiriman melalui WhatsApp
                      </p>
                    </div>
                    <Switch
                      checked={user.notify_whatsapp ?? true}
                      disabled={savingPref === "notify_whatsapp"}
                      onCheckedChange={(v) => void handleTogglePreference("notify_whatsapp", v)}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={Settings} title="Pengaturan">
                <div className="space-y-1">
                  <SettingsRow
                    icon={Edit}
                    label="Edit Profil"
                    onClick={() => router.push(`/dashboard/akun/profil/edit`)}
                  />
                  <SettingsRow
                    icon={Landmark}
                    label="Rekening Bank"
                    onClick={() => router.push(`/dashboard/akun/rekening`)}
                  />
                  <SettingsRow
                    icon={Share2}
                    label="Social Media"
                    onClick={() => router.push(`/dashboard/akun/social-media`)}
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

function DocumentRow({
  label,
  exists,
  verified,
  loading,
  onView,
  onUpload,
}: {
  label: string;
  exists: boolean;
  /** Dokumen sudah ditinjau admin (corporate_approved_at) - personal tidak punya proses ini. */
  verified: boolean;
  loading: boolean;
  onView: () => void;
  onUpload?: () => void;
}) {
  const statusLabel = !exists ? "Belum Diunggah" : verified ? "Terverifikasi" : "Tersimpan";
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-slate-400" aria-hidden />
        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <StatusBadge status={exists && verified ? "success" : "pending"} label={statusLabel} />
        </div>
      </div>
      {exists ? (
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={onView}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Lihat File"}
        </Button>
      ) : (
        onUpload && (
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={onUpload}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upload"}
          </Button>
        )
      )}
    </div>
  );
}

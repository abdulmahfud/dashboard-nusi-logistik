"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BankLogo } from "@/components/redesign/bank-logo";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { StatCard } from "@/components/redesign/stat-card";
import { StatusBadge } from "@/components/redesign/status-badge";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle,
  Building2,
  Copy,
  Edit,
  FileText,
  Image as ImageIcon,
  Landmark,
  Loader2,
  RefreshCw,
  Save,
  Star,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import TopNav from "@/components/top-nav";
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setDefaultBankAccount,
} from "@/lib/apiClient";
import type {
  BankAccount,
  BankAccountCreateRequest,
  BankAccountUpdateRequest,
} from "@/types/bankAccount";
import { useAuth } from "@/context/AuthContext";
import { AxiosError } from "axios";

const BANK_LIST = [
  "Bank Mandiri",
  "Bank Rakyat Indonesia (BRI)",
  "Bank Negara Indonesia (BNI)",
  "Bank Central Asia (BCA)",
  "Bank Tabungan Negara (BTN)",
  "Bank CIMB Niaga",
  "Bank Danamon",
  "Bank Permata",
  "Bank OCBC NISP",
  "Bank Maybank Indonesia",
  "Bank Mega",
  "Bank Panin",
  "Bank UOB Indonesia",
  "Bank Sinarmas",
  "Bank BTPN",
  "Bank Jago",
  "Bank Neo Commerce (BNC)",
  "Bank Syariah Indonesia (BSI)",
  "Bank Muamalat",
  "Bank Mega Syariah",
  "SeaBank",
  "Blue by BCA Digital",
  "Jenius",
  "TMRW by UOB",
  "Line Bank by Hana Bank",
  "Bank DKI",
  "Bank Jabar Banten (BJB)",
  "Bank Jateng",
  "Bank Jatim",
  "Bank Sumut",
  "Bank Nagari (Sumbar)",
  "Bank Sumsel Babel",
  "Bank Kalbar",
  "Bank Kaltimtara",
  "Bank Sulselbar",
  "Bank Aceh Syariah",
];

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-800";

/** "1234567890" -> "******7890" (4 digit terakhir tetap terlihat). */
function maskAccountNumber(value: string): string {
  if (value.length <= 4) return value;
  return "*".repeat(value.length - 4) + value.slice(-4);
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const msg = (error.response?.data as { message?: string })?.message;
    if (msg) return msg;
  }
  return fallback;
}

type FormValues = {
  bank_name: string;
  account_name: string;
  account_number: string;
};

type FileState = { photo_rekening: File | null; photo_ktp: File | null };
type PreviewState = { photo_rekening: string | null; photo_ktp: string | null };

const EMPTY_FILES: FileState = { photo_rekening: null, photo_ktp: null };
const EMPTY_PREVIEWS: PreviewState = { photo_rekening: null, photo_ktp: null };

function readFileAsPreview(
  field: "photo_rekening" | "photo_ktp",
  file: File | null,
  setFiles: React.Dispatch<React.SetStateAction<FileState>>,
  setPreviews: React.Dispatch<React.SetStateAction<PreviewState>>
) {
  if (!file) {
    setFiles((prev) => ({ ...prev, [field]: null }));
    setPreviews((prev) => ({ ...prev, [field]: null }));
    return;
  }
  if (!file.type.startsWith("image/")) {
    toast.error("File harus berupa gambar");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.error("Ukuran file maksimal 2MB");
    return;
  }
  setFiles((prev) => ({ ...prev, [field]: file }));
  const reader = new FileReader();
  reader.onload = (e) => {
    setPreviews((prev) => ({ ...prev, [field]: e.target?.result as string }));
  };
  reader.readAsDataURL(file);
}

/** Kotak unggah bergaya sama untuk form tambah & edit. */
function FileDropzone({
  label,
  required,
  hint,
  inputId,
  inputRef,
  file,
  preview,
  existingUrl,
  disabled,
  icon: Icon,
  onPick,
  onRemove,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement>;
  file: File | null;
  preview: string | null;
  existingUrl?: string | null;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  onPick: (file: File | null) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={(e) => onPick(e.target.files?.[0] || null)}
        ref={inputRef}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/40"
      >
        {file ? (
          <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Icon className="h-5 w-5 text-blue-600" />
            <span className="max-w-[200px] truncate">{file.name}</span>
            <X
              className="h-4 w-4 text-slate-400 hover:text-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            />
          </span>
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Upload className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-slate-700">
              Klik atau tarik file ke sini
            </span>
            <span className="text-xs text-slate-400">
              {hint ?? "PNG, JPG maksimal 2MB"}
            </span>
          </>
        )}
      </button>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- pratinjau dari data URL lokal
        <img
          src={preview}
          alt={`Pratinjau ${label.toLowerCase()}`}
          className="mt-2 h-auto max-w-full rounded-lg border border-slate-200"
        />
      ) : existingUrl ? (
        <p className="mt-1 text-xs text-slate-500">
          Sudah ada foto tersimpan. Unggah file baru untuk menggantinya.
        </p>
      ) : null}
    </div>
  );
}

const Rekening = () => {
  const { user, loading: authLoading } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState<FormValues>({
    bank_name: "",
    account_name: "",
    account_number: "",
  });
  const [files, setFiles] = useState<FileState>(EMPTY_FILES);
  const [previews, setPreviews] = useState<PreviewState>(EMPTY_PREVIEWS);
  const rekeningInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BankAccount | null>(null);
  const [editData, setEditData] = useState<FormValues>({
    bank_name: "",
    account_name: "",
    account_number: "",
  });
  const [editFiles, setEditFiles] = useState<FileState>(EMPTY_FILES);
  const [editPreviews, setEditPreviews] = useState<PreviewState>(EMPTY_PREVIEWS);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editRekeningInputRef = useRef<HTMLInputElement>(null);
  const editKtpInputRef = useRef<HTMLInputElement>(null);

  // Ajukan hapus
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Jadikan utama
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  /** Hanya rekening milik user login (bukan daftar admin), meskipun role admin */
  const fetchBankAccounts = useCallback(async () => {
    if (!user?.id) {
      setBankAccounts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await getBankAccounts();
      const list = response.data ?? [];
      const mine = list.filter(
        (a) =>
          a.user_id === user.id ||
          (a.user?.id != null && a.user.id === user.id)
      );
      setBankAccounts(mine);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      toast.error("Gagal memuat data rekening");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    void fetchBankAccounts();
  }, [authLoading, fetchBankAccounts]);

  const handleInputChange = (field: keyof FormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const removeFile = (field: "photo_rekening" | "photo_ktp") => {
    readFileAsPreview(field, null, setFiles, setPreviews);
    if (field === "photo_rekening" && rekeningInputRef.current) {
      rekeningInputRef.current.value = "";
    }
    if (field === "photo_ktp" && ktpInputRef.current) {
      ktpInputRef.current.value = "";
    }
  };

  const validateForm = (data: FormValues, filesToCheck: FileState, requirePhotos: boolean) => {
    if (!data.bank_name.trim()) {
      toast.error("Nama bank harus diisi");
      return false;
    }
    if (!data.account_name.trim()) {
      toast.error("Nama rekening harus diisi");
      return false;
    }
    if (!/^[a-zA-Z\s.]+$/.test(data.account_name.trim())) {
      toast.error("Nama rekening hanya boleh huruf, spasi");
      return false;
    }
    if (!data.account_number.trim()) {
      toast.error("Nomor rekening harus diisi");
      return false;
    }
    if (requirePhotos) {
      if (!filesToCheck.photo_rekening) {
        toast.error("Foto rekening harus diupload");
        return false;
      }
      if (!filesToCheck.photo_ktp) {
        toast.error("Foto KTP harus diupload");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData, files, true)) return;

    try {
      setCreating(true);
      const submitData: BankAccountCreateRequest = {
        bank_name: formData.bank_name,
        account_name: formData.account_name,
        account_number: formData.account_number,
        photo_rekening: files.photo_rekening!,
        photo_ktp: files.photo_ktp!,
      };

      await createBankAccount(submitData);
      toast.success("Rekening berhasil dikirim untuk verifikasi");
      setFormData({ bank_name: "", account_name: "", account_number: "" });
      setFiles(EMPTY_FILES);
      setPreviews(EMPTY_PREVIEWS);
      if (rekeningInputRef.current) rekeningInputRef.current.value = "";
      if (ktpInputRef.current) ktpInputRef.current.value = "";
      fetchBankAccounts();
    } catch (error: unknown) {
      console.error("Error creating bank account:", error);
      toast.error(extractErrorMessage(error, "Gagal menambahkan rekening"));
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (account: BankAccount) => {
    setEditTarget(account);
    setEditData({
      bank_name: account.bank_name,
      account_name: account.account_name,
      account_number: account.account_number,
    });
    setEditFiles(EMPTY_FILES);
    setEditPreviews(EMPTY_PREVIEWS);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!validateForm(editData, editFiles, false)) return;

    try {
      setEditSubmitting(true);
      const body: BankAccountUpdateRequest = {
        bank_name: editData.bank_name,
        account_name: editData.account_name,
        account_number: editData.account_number,
        photo_rekening: editFiles.photo_rekening ?? undefined,
        photo_ktp: editFiles.photo_ktp ?? undefined,
      };
      await updateBankAccount(editTarget.id, body);
      toast.success("Rekening berhasil diubah, menunggu verifikasi ulang admin.");
      setEditOpen(false);
      setEditTarget(null);
      fetchBankAccounts();
    } catch (error) {
      console.error("Error updating bank account:", error);
      toast.error(extractErrorMessage(error, "Gagal mengubah rekening"));
    } finally {
      setEditSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const res = await deleteBankAccount(deleteTarget.id);
      toast.success(res.message || "Permintaan penghapusan berhasil diajukan.");
      setDeleteTarget(null);
      fetchBankAccounts();
    } catch (error) {
      console.error("Error requesting bank account deletion:", error);
      toast.error(extractErrorMessage(error, "Gagal mengajukan penghapusan rekening"));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleSetDefault = async (account: BankAccount) => {
    setSettingDefaultId(account.id);
    try {
      await setDefaultBankAccount(account.id);
      toast.success("Rekening berhasil dijadikan utama.");
      fetchBankAccounts();
    } catch (error) {
      console.error("Error setting default bank account:", error);
      toast.error(extractErrorMessage(error, "Gagal menjadikan rekening utama"));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const copyAccountNumber = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      toast.success("Nomor rekening disalin");
    } catch {
      toast.error("Gagal menyalin nomor rekening");
    }
  };

  const totalAccounts = bankAccounts.length;
  const activeAccounts = bankAccounts.filter((a) => a.status === "approved").length;
  const defaultAccount = bankAccounts.find((a) => a.is_default) ?? null;

  if (authLoading || loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex min-h-[40vh] items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Memuat data rekening...</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
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

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Rekening" },
            ]}
            icon={Building2}
            title="Rekening Bank"
            description="Kelola rekening bank Anda untuk pencairan saldo."
            action={
              <Button
                onClick={fetchBankAccounts}
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-10 gap-2 rounded-lg border-slate-200 bg-white"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={Wallet}
              tone="blue"
              title="Total Rekening"
              value={String(totalAccounts)}
              hint="Semua rekening bank"
            />
            <StatCard
              icon={Building2}
              tone="green"
              title="Rekening Aktif"
              value={String(activeAccounts)}
              hint="Sudah disetujui admin"
            />
            <StatCard
              icon={Star}
              tone="orange"
              title="Rekening Utama"
              value={defaultAccount?.bank_name ?? "-"}
              hint={
                defaultAccount
                  ? "Bank utama untuk pencairan"
                  : "Belum ada rekening utama"
              }
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {/* Form tambah rekening */}
            <div className="min-w-0 lg:col-span-1">
              <SectionCard
                icon={Landmark}
                title="Tambah Rekening Bank"
                description="Tambahkan rekening bank baru untuk pencairan saldo."
              >
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name" className={labelCls}>
                      Nama Bank <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.bank_name}
                      onValueChange={(v) => handleInputChange("bank_name", v)}
                    >
                      <SelectTrigger id="bank_name" className={fieldCls}>
                        <SelectValue placeholder="Pilih nama bank" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[min(320px,50vh)] overflow-y-auto">
                        {BANK_LIST.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_name" className={labelCls}>
                      Nama Rekening <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="account_name"
                      type="text"
                      value={formData.account_name}
                      onChange={(e) => handleInputChange("account_name", e.target.value)}
                      placeholder="Sesuai dengan nama di rekening"
                      required
                      className={fieldCls}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number" className={labelCls}>
                      Nomor Rekening <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="account_number"
                      type="text"
                      value={formData.account_number}
                      onChange={(e) => handleInputChange("account_number", e.target.value)}
                      placeholder="1234567890"
                      required
                      className={fieldCls}
                    />
                  </div>

                  <FileDropzone
                    label="Foto Buku Rekening"
                    required
                    inputId="photo_rekening"
                    inputRef={rekeningInputRef}
                    file={files.photo_rekening}
                    preview={previews.photo_rekening}
                    disabled={creating}
                    icon={ImageIcon}
                    onPick={(f) => readFileAsPreview("photo_rekening", f, setFiles, setPreviews)}
                    onRemove={() => removeFile("photo_rekening")}
                  />

                  <FileDropzone
                    label="Foto KTP"
                    required
                    inputId="photo_ktp"
                    inputRef={ktpInputRef}
                    file={files.photo_ktp}
                    preview={previews.photo_ktp}
                    disabled={creating}
                    icon={FileText}
                    onPick={(f) => readFileAsPreview("photo_ktp", f, setFiles, setPreviews)}
                    onRemove={() => removeFile("photo_ktp")}
                  />

                  <Button
                    type="submit"
                    disabled={creating}
                    className="h-11 w-full gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" aria-hidden />
                        Simpan Rekening
                      </>
                    )}
                  </Button>
                </form>
              </SectionCard>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 md:p-5">
                <h3 className="mb-2 font-semibold text-blue-900">
                  Informasi Penting:
                </h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Pastikan nama rekening sesuai dengan identitas Anda</li>
                  <li>• Nomor rekening harus valid dan aktif</li>
                  <li>• Upload foto rekening yang jelas dan terbaca</li>
                  <li>• Upload foto KTP yang sesuai dengan nama rekening</li>
                  <li>• File gambar maksimal 2MB (JPG, PNG)</li>
                  <li>
                    • Rekening akan diverifikasi oleh admin dalam 1-3 hari kerja
                  </li>
                  <li>
                    • Mengubah rekening yang sudah disetujui akan membuatnya
                    perlu diverifikasi ulang
                  </li>
                  <li>
                    • Menghapus rekening perlu persetujuan admin terlebih dahulu
                  </li>
                </ul>
              </div>
            </div>

            {/* Daftar rekening */}
            <div className="min-w-0 lg:col-span-2">
              <SectionCard
                icon={Users}
                title="Daftar Rekening Bank"
                description={
                  totalAccounts > 0
                    ? `${totalAccounts} rekening terdaftar.`
                    : "Daftar rekening bank yang terdaftar."
                }
              >
                {totalAccounts === 0 ? (
                  <div className="flex flex-col items-center px-4 py-10 text-center">
                    <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                      <Building2 className="h-9 w-9 text-blue-300" aria-hidden />
                    </span>
                    <p className="font-semibold text-slate-900">
                      Belum ada rekening bank
                    </p>
                    <p className="mt-1 max-w-xs text-sm text-slate-500">
                      Tambahkan rekening bank lewat form di sebelah kiri untuk
                      mulai menarik saldo Anda.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankAccounts.map((account) => {
                      const isDeletionPending = Boolean(account.deletion_requested_at);
                      return (
                        <div
                          key={account.id}
                          className="rounded-2xl border border-slate-100 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <BankLogo bankName={account.bank_name} />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {account.bank_name}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {account.account_name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyAccountNumber(account.account_number)
                                  }
                                  className="mt-1 flex items-center gap-1.5 font-mono text-sm text-slate-700 hover:text-blue-600"
                                  title="Salin nomor rekening"
                                >
                                  {maskAccountNumber(account.account_number)}
                                  <Copy className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              {isDeletionPending ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                                  <Trash2 className="h-3 w-3" aria-hidden />
                                  Menunggu Persetujuan Hapus
                                </span>
                              ) : (
                                <>
                                  {account.is_default && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                      <Star className="h-3 w-3" aria-hidden />
                                      Rekening Utama
                                    </span>
                                  )}
                                  {account.status === "approved" ? (
                                    <StatusBadge status="success" label="Aktif" />
                                  ) : account.status === "rejected" ? (
                                    <StatusBadge status="failed" label="Ditolak" />
                                  ) : (
                                    <StatusBadge
                                      status="pending"
                                      label="Menunggu Verifikasi"
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {account.status === "rejected" && account.rejected_reason && (
                            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                              <p className="text-xs text-rose-800">
                                <strong>Alasan Penolakan:</strong>{" "}
                                {account.rejected_reason}
                              </p>
                            </div>
                          )}

                          {!isDeletionPending && (
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5 rounded-lg border-slate-200 text-slate-700"
                                onClick={() => openEdit(account)}
                              >
                                <Edit className="h-3.5 w-3.5" aria-hidden />
                                Edit
                              </Button>
                              {account.status === "approved" && !account.is_default && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-9 gap-1.5 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
                                  disabled={settingDefaultId === account.id}
                                  onClick={() => void handleSetDefault(account)}
                                >
                                  {settingDefaultId === account.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Star className="h-3.5 w-3.5" aria-hidden />
                                  )}
                                  Jadikan Utama
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50"
                                onClick={() => setDeleteTarget(account)}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Hapus
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </div>

        {/* Edit rekening */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl border-slate-100 p-0 sm:max-w-lg">
            <DialogHeader className="shrink-0 border-b border-slate-100 p-6 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Edit className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <DialogTitle>Edit Rekening</DialogTitle>
                  <DialogDescription>
                    Perubahan akan membuat rekening ini perlu diverifikasi ulang
                    oleh admin.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
                <div className="space-y-2">
                  <Label className={labelCls}>
                    Nama Bank <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editData.bank_name}
                    onValueChange={(v) =>
                      setEditData((prev) => ({ ...prev, bank_name: v }))
                    }
                  >
                    <SelectTrigger className={fieldCls}>
                      <SelectValue placeholder="Pilih nama bank" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(320px,50vh)] overflow-y-auto">
                      {BANK_LIST.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_account_name" className={labelCls}>
                    Nama Rekening <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit_account_name"
                    value={editData.account_name}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, account_name: e.target.value }))
                    }
                    required
                    className={fieldCls}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_account_number" className={labelCls}>
                    Nomor Rekening <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit_account_number"
                    value={editData.account_number}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, account_number: e.target.value }))
                    }
                    required
                    className={fieldCls}
                  />
                </div>

                <FileDropzone
                  label="Foto Buku Rekening"
                  hint="Opsional — kosongkan jika tidak diganti"
                  inputId="edit_photo_rekening"
                  inputRef={editRekeningInputRef}
                  file={editFiles.photo_rekening}
                  preview={editPreviews.photo_rekening}
                  existingUrl={editTarget?.photo_rekening_url}
                  disabled={editSubmitting}
                  icon={ImageIcon}
                  onPick={(f) =>
                    readFileAsPreview("photo_rekening", f, setEditFiles, setEditPreviews)
                  }
                  onRemove={() => {
                    readFileAsPreview("photo_rekening", null, setEditFiles, setEditPreviews);
                    if (editRekeningInputRef.current) editRekeningInputRef.current.value = "";
                  }}
                />

                <FileDropzone
                  label="Foto KTP"
                  hint="Opsional — kosongkan jika tidak diganti"
                  inputId="edit_photo_ktp"
                  inputRef={editKtpInputRef}
                  file={editFiles.photo_ktp}
                  preview={editPreviews.photo_ktp}
                  existingUrl={editTarget?.photo_ktp_url}
                  disabled={editSubmitting}
                  icon={FileText}
                  onPick={(f) =>
                    readFileAsPreview("photo_ktp", f, setEditFiles, setEditPreviews)
                  }
                  onRemove={() => {
                    readFileAsPreview("photo_ktp", null, setEditFiles, setEditPreviews);
                    if (editKtpInputRef.current) editKtpInputRef.current.value = "";
                  }}
                />
              </div>
              <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 p-6">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg border-slate-200"
                  onClick={() => setEditOpen(false)}
                  disabled={editSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={editSubmitting}
                  className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  {editSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden />
                  )}
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Ajukan hapus rekening */}
        <Dialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
            <DialogHeader className="items-center text-center sm:text-center">
              <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-7 w-7" aria-hidden />
              </span>
              <DialogTitle>Ajukan hapus rekening?</DialogTitle>
              <DialogDescription>
                Rekening <strong>{deleteTarget?.bank_name}</strong> ·{" "}
                {deleteTarget ? maskAccountNumber(deleteTarget.account_number) : ""}{" "}
                akan diajukan untuk dihapus. Rekening baru benar-benar terhapus
                setelah disetujui admin.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteSubmitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-10 gap-2 rounded-lg"
                disabled={deleteSubmitting}
                onClick={() => void confirmDelete()}
              >
                {deleteSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Ajukan Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Rekening;

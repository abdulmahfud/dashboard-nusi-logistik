"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Building2,
  Phone,
  RefreshCw,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import TopNav from "@/components/top-nav";
import { getBankAccounts, createBankAccount } from "@/lib/apiClient";
import { BankAccount, BankAccountCreateRequest } from "@/types/bankAccount";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

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

const Rekening = () => {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
  });
  const [files, setFiles] = useState<{
    photo_rekening: File | null;
    photo_ktp: File | null;
  }>({
    photo_rekening: null,
    photo_ktp: null,
  });
  const [previews, setPreviews] = useState<{
    photo_rekening: string | null;
    photo_ktp: string | null;
  }>({
    photo_rekening: null,
    photo_ktp: null,
  });

  const rekeningInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (
    field: "photo_rekening" | "photo_ktp",
    file: File | null
  ) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 2MB");
        return;
      }

      setFiles((prev) => ({ ...prev, [field]: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => ({
          ...prev,
          [field]: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFiles((prev) => ({ ...prev, [field]: null }));
      setPreviews((prev) => ({ ...prev, [field]: null }));
    }
  };

  const removeFile = (field: "photo_rekening" | "photo_ktp") => {
    setFiles((prev) => ({ ...prev, [field]: null }));
    setPreviews((prev) => ({ ...prev, [field]: null }));
    if (field === "photo_rekening" && rekeningInputRef.current) {
      rekeningInputRef.current.value = "";
    }
    if (field === "photo_ktp" && ktpInputRef.current) {
      ktpInputRef.current.value = "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <X className="h-3 w-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu Verifikasi
          </Badge>
        );
    }
  };

  const validateForm = () => {
    if (!formData.bank_name.trim()) {
      toast.error("Nama bank harus diisi");
      return false;
    }
    if (!formData.account_name.trim()) {
      toast.error("Nama rekening harus diisi");
      return false;
    }
    if (!/^[a-zA-Z\s.]+$/.test(formData.account_name.trim())) {
      toast.error("Nama rekening hanya boleh huruf, spasi");
      return false;
    }
    if (!formData.account_number.trim()) {
      toast.error("Nomor rekening harus diisi");
      return false;
    }
    if (!files.photo_rekening) {
      toast.error("Foto rekening harus diupload");
      return false;
    }
    if (!files.photo_ktp) {
      toast.error("Foto KTP harus diupload");
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
      setFiles({ photo_rekening: null, photo_ktp: null });
      setPreviews({ photo_rekening: null, photo_ktp: null });
      if (rekeningInputRef.current) rekeningInputRef.current.value = "";
      if (ktpInputRef.current) ktpInputRef.current.value = "";
      fetchBankAccounts(); // Refresh data
    } catch (error: unknown) {
      console.error("Error creating bank account:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 409) {
          toast.error(
            "Anda sudah memiliki rekening bank. Tidak dapat menambahkan lebih dari satu."
          );
        } else {
          toast.error("Gagal menambahkan rekening");
        }
      } else {
        toast.error("Gagal menambahkan rekening");
      }
    } finally {
      setCreating(false);
    }
  };

  const hasAccount = bankAccounts.length > 0;

  if (authLoading || loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              Memuat data rekening...
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
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-7 w-7 text-blue-600" />
                Rekening Bank
              </h1>
              <p className="text-muted-foreground text-sm">
                Hanya menampilkan rekening Anda sendiri untuk penarikan saldo.
              </p>
              {hasPermission("bank-accounts.view_all") && (
                <p className="text-muted-foreground mt-1 max-w-xl text-sm">
                  Untuk melihat atau menyetujui rekening pengguna lain, gunakan
                  menu{" "}
                  <Link
                    href="/dashboard/akun/semua-rekening"
                    className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
                  >
                    Semua rekening bank
                  </Link>
                  .
                </p>
              )}
            </div>
            <Button
              onClick={fetchBankAccounts}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {hasAccount ? (
            // Show existing bank account
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <Card key={account.id} className="shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {account.bank_name}
                      </CardTitle>
                      {getStatusBadge(account.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Nama Rekening
                        </Label>
                        <p className="text-lg font-medium">
                          {account.account_name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Nomor Rekening
                        </Label>
                        <p className="text-lg font-mono">
                          {account.account_number}
                        </p>
                      </div>
                    </div>

                    {account.status === "rejected" &&
                      account.rejected_reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-800">
                            <strong>Alasan Penolakan:</strong>{" "}
                            {account.rejected_reason}
                          </p>
                        </div>
                      )}

                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Tanggal Ditambahkan
                      </Label>
                      <p className="text-sm">
                        {new Date(account.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    {account.verified_at && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Tanggal Disetujui
                        </Label>
                        <p className="text-sm text-green-600">
                          {new Date(account.verified_at).toLocaleDateString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Info untuk mengganti rekening */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-900">
                        Ingin Mengganti Rekening?
                      </h3>
                      <p className="text-sm text-amber-800 mt-1">
                        Untuk mengganti atau menambah rekening bank, silakan
                        hubungi customer service kami melalui WhatsApp atau
                        email.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          onClick={() =>
                            window.open("https://wa.me/6281330323559", "_blank")
                          }
                        >
                          WhatsApp CS
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          onClick={() =>
                            window.open(
                              "mailto:support@bhisakirim.com",
                              "_blank"
                            )
                          }
                        >
                          Email CS
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Show form to add bank account
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Tambah Rekening Bank
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Tambahkan rekening bank untuk penarikan saldo
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Nama Bank *</Label>
                      <select
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) =>
                          handleInputChange("bank_name", e.target.value)
                        }
                        required
                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih Bank</option>
                        {BANK_LIST.map((bank, idx) => (
                          <option key={idx} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account_name">Nama Rekening *</Label>
                      <Input
                        id="account_name"
                        type="text"
                        value={formData.account_name}
                        onChange={(e) =>
                          handleInputChange("account_name", e.target.value)
                        }
                        placeholder="Sesuai dengan nama di rekening"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account_number">Nomor Rekening *</Label>
                      <Input
                        id="account_number"
                        type="text"
                        value={formData.account_number}
                        onChange={(e) =>
                          handleInputChange("account_number", e.target.value)
                        }
                        placeholder="1234567890"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo_rekening">Foto Rekening *</Label>
                      <Input
                        id="photo_rekening"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(
                            "photo_rekening",
                            e.target.files?.[0] || null
                          )
                        }
                        ref={rekeningInputRef}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => rekeningInputRef.current?.click()}
                        className="w-full bg-blue-500 text-white hover:bg-blue-600"
                        disabled={creating}
                      >
                        {files.photo_rekening ? (
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            {files.photo_rekening.name}
                            <X
                              className="h-4 w-4 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile("photo_rekening");
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Foto Rekening
                          </>
                        )}
                      </Button>
                      {previews.photo_rekening && (
                        <div className="mt-2">
                          <img
                            src={previews.photo_rekening}
                            alt="Preview Rekening"
                            className="max-w-sm h-auto rounded-md"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo_ktp">Foto KTP *</Label>
                      <Input
                        id="photo_ktp"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(
                            "photo_ktp",
                            e.target.files?.[0] || null
                          )
                        }
                        ref={ktpInputRef}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => ktpInputRef.current?.click()}
                        className="w-full bg-blue-500 text-white hover:bg-blue-600"
                        disabled={creating}
                      >
                        {files.photo_ktp ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {files.photo_ktp.name}
                            <X
                              className="h-4 w-4 cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile("photo_ktp");
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Foto KTP
                          </>
                        )}
                      </Button>
                      {previews.photo_ktp && (
                        <div className="mt-2">
                          <img
                            src={previews.photo_ktp}
                            alt="Preview KTP"
                            className="max-w-sm h-auto rounded-md"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={creating}
                        className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
                      >
                        {creating ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Tambah Rekening
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Informasi Penting:
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Pastikan nama rekening sesuai dengan identitas Anda
                    </li>
                    <li>• Nomor rekening harus valid dan aktif</li>
                    <li>• Upload foto rekening yang jelas dan terbaca</li>
                    <li>• Upload foto KTP yang sesuai dengan nama rekening</li>
                    <li>• File gambar maksimal 2MB (JPG, PNG)</li>
                    <li>
                      • Rekening akan diverifikasi oleh admin dalam 1-3 hari
                      kerja
                    </li>
                    <li>
                      • Setelah disetujui, rekening dapat digunakan untuk
                      penarikan saldo
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Rekening;

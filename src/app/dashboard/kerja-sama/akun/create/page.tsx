"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { createKerjaSamaAccount, getUsers } from "@/lib/apiClient";
import type { CreateKerjaSamaAccountPayload } from "@/types/kerjaSama";
import type { User } from "@/types/users";
import { AxiosError } from "axios";
import { ArrowLeft, Handshake, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function CreateKerjaSamaAkunPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();

  const [submitting, setSubmitting] = useState(false);

  // Pencarian user yang sudah ada
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [searchingUser, setSearchingUser] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const userInputRef = useRef<HTMLDivElement>(null);

  const [accountType, setAccountType] = useState<"personal" | "corporate">(
    "corporate"
  );
  const [form, setForm] = useState({
    company_name: "",
    company_legality_no: "",
    npwp: "",
    pic_name: "",
    pic_ktp_no: "",
    ktp_no: "",
    billing_address: "",
    billing_phone: "",
    billing_email: "",
    billing_bank_name: "",
    billing_bank_account_name: "",
    billing_bank_account_no: "",
    credit_limit: "",
    max_outstanding: "",
    billing_due_day: "25",
    pic_penagihan_name: "",
    pic_penagihan_phone: "",
    kerja_sama_notes: "",
  });

  useEffect(() => {
    if (
      !authLoading &&
      !hasPermission("kerja-sama.accounts.create")
    ) {
      router.replace("/dashboard/kerja-sama/akun");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userInputRef.current &&
        !userInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (userQuery.trim().length < 3 || selectedUser) {
      setUserResults([]);
      return;
    }
    setSearchingUser(true);
    const t = setTimeout(() => {
      getUsers({ search: userQuery, per_page: 10 })
        .then((res) => {
          setUserResults(res.data.data);
          setShowResults(true);
        })
        .catch(() => setUserResults([]))
        .finally(() => setSearchingUser(false));
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery, selectedUser]);

  const handleField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setUserQuery(`${user.name} (${user.email})`);
    setShowResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error("Pilih user yang sudah terdaftar terlebih dahulu.");
      return;
    }
    if (accountType === "corporate") {
      if (!form.company_name.trim() || !form.pic_name.trim()) {
        toast.error(
          "Nama perusahaan dan nama PIC wajib diisi untuk akun corporate."
        );
        return;
      }
    } else if (!form.ktp_no.trim()) {
      toast.error("Nomor KTP wajib diisi untuk akun personal.");
      return;
    }
    if (!form.credit_limit || Number(form.credit_limit) < 0) {
      toast.error("Limit kredit wajib diisi (angka ≥ 0).");
      return;
    }

    const payload: CreateKerjaSamaAccountPayload = {
      user_id: selectedUser.id,
      account_type: accountType,
      credit_limit: Number(form.credit_limit),
    };
    if (accountType === "corporate") {
      payload.company_name = form.company_name;
      payload.pic_name = form.pic_name;
      if (form.company_legality_no)
        payload.company_legality_no = form.company_legality_no;
      if (form.npwp) payload.npwp = form.npwp;
      if (form.pic_ktp_no) payload.pic_ktp_no = form.pic_ktp_no;
    } else {
      payload.ktp_no = form.ktp_no;
    }
    if (form.billing_address) payload.billing_address = form.billing_address;
    if (form.billing_phone) payload.billing_phone = form.billing_phone;
    if (form.billing_email) payload.billing_email = form.billing_email;
    if (form.billing_bank_name)
      payload.billing_bank_name = form.billing_bank_name;
    if (form.billing_bank_account_name)
      payload.billing_bank_account_name = form.billing_bank_account_name;
    if (form.billing_bank_account_no)
      payload.billing_bank_account_no = form.billing_bank_account_no;
    if (form.max_outstanding)
      payload.max_outstanding = Number(form.max_outstanding);
    if (form.billing_due_day)
      payload.billing_due_day = Number(form.billing_due_day);
    if (form.pic_penagihan_name)
      payload.pic_penagihan_name = form.pic_penagihan_name;
    if (form.pic_penagihan_phone)
      payload.pic_penagihan_phone = form.pic_penagihan_phone;
    if (form.kerja_sama_notes) payload.kerja_sama_notes = form.kerja_sama_notes;

    setSubmitting(true);
    try {
      await createKerjaSamaAccount(payload);
      toast.success("Akun kerja sama berhasil diaktifkan.");
      router.push(`/dashboard/kerja-sama/akun/${selectedUser.id}`);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as {
          message?: string;
          errors?: Record<string, string[]>;
        };
        if (data.errors) {
          Object.values(data.errors)
            .flat()
            .forEach((msg) => toast.error(msg));
        } else {
          toast.error(data.message || "Gagal mengaktifkan akun kerja sama.");
        }
      } else {
        toast.error("Gagal mengaktifkan akun kerja sama.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;
  if (!hasPermission("kerja-sama.accounts.create")) return null;

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

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => router.push("/dashboard/kerja-sama/akun")}
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                <Handshake className="h-6 w-6 text-blue-600" />
                Aktifkan Akun Kerja Sama
              </h1>
              <p className="text-muted-foreground text-sm">
                Data & limit yang sudah disepakati di luar sistem (offline).
                Begitu disimpan, akun langsung aktif — tidak ada status
                pending.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Pilih User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative" ref={userInputRef}>
                  <Label htmlFor="user-search">
                    Cari user terdaftar (nama/email){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="user-search"
                      placeholder="Ketik minimal 3 huruf…"
                      value={userQuery}
                      onChange={(e) => {
                        setUserQuery(e.target.value);
                        setSelectedUser(null);
                      }}
                      autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {searchingUser ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : (
                        <Search className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {showResults && userResults.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                      {userResults.map((u) => (
                        <div
                          key={u.id}
                          className="cursor-pointer border-b p-3 last:border-b-0 hover:bg-blue-50"
                          onClick={() => handleSelectUser(u)}
                        >
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <p className="mt-2 text-sm text-green-700">
                      Terpilih: {selectedUser.name} ({selectedUser.email})
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Tipe Akun</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={accountType}
                  onValueChange={(v) =>
                    setAccountType(v as "personal" | "corporate")
                  }
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <Label
                    htmlFor="type-corporate"
                    className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer ${
                      accountType === "corporate"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <RadioGroupItem id="type-corporate" value="corporate" />
                    Corporate (Perusahaan)
                  </Label>
                  <Label
                    htmlFor="type-personal"
                    className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer ${
                      accountType === "personal"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <RadioGroupItem id="type-personal" value="personal" />
                    Personal
                  </Label>
                </RadioGroup>

                {accountType === "corporate" ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">
                        Nama Perusahaan <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="company_name"
                        value={form.company_name}
                        onChange={(e) =>
                          handleField("company_name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pic_name">
                        Nama PIC <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pic_name"
                        value={form.pic_name}
                        onChange={(e) =>
                          handleField("pic_name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_legality_no">
                        No. Legalitas (NIB/SIUP)
                      </Label>
                      <Input
                        id="company_legality_no"
                        value={form.company_legality_no}
                        onChange={(e) =>
                          handleField("company_legality_no", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="npwp">NPWP</Label>
                      <Input
                        id="npwp"
                        value={form.npwp}
                        onChange={(e) => handleField("npwp", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pic_ktp_no">No. KTP PIC</Label>
                      <Input
                        id="pic_ktp_no"
                        value={form.pic_ktp_no}
                        onChange={(e) =>
                          handleField("pic_ktp_no", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 md:w-1/2">
                    <Label htmlFor="ktp_no">
                      Nomor KTP <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ktp_no"
                      value={form.ktp_no}
                      onChange={(e) => handleField("ktp_no", e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Limit Kredit</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="credit_limit">
                    Limit Kredit (Rp) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    min={0}
                    value={form.credit_limit}
                    onChange={(e) =>
                      handleField("credit_limit", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_outstanding">
                    Max Outstanding (Rp)
                  </Label>
                  <Input
                    id="max_outstanding"
                    type="number"
                    min={0}
                    placeholder="Default: sama dengan limit kredit"
                    value={form.max_outstanding}
                    onChange={(e) =>
                      handleField("max_outstanding", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_due_day">
                    Tanggal Jatuh Tempo (1-31)
                  </Label>
                  <Input
                    id="billing_due_day"
                    type="number"
                    min={1}
                    max={31}
                    value={form.billing_due_day}
                    onChange={(e) =>
                      handleField("billing_due_day", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Tanggal tetap tiap bulan (default 25). Kalau sudah lewat
                    saat invoice digenerate, jatuh tempo otomatis maju ke
                    bulan depan.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  4. Data Penagihan (opsional)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="billing_address">Alamat Penagihan</Label>
                  <Textarea
                    id="billing_address"
                    value={form.billing_address}
                    onChange={(e) =>
                      handleField("billing_address", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing_phone">Telepon Penagihan</Label>
                    <Input
                      id="billing_phone"
                      value={form.billing_phone}
                      onChange={(e) =>
                        handleField("billing_phone", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing_email">Email Penagihan</Label>
                    <Input
                      id="billing_email"
                      type="email"
                      value={form.billing_email}
                      onChange={(e) =>
                        handleField("billing_email", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_bank_name">Nama Bank</Label>
                  <Input
                    id="billing_bank_name"
                    value={form.billing_bank_name}
                    onChange={(e) =>
                      handleField("billing_bank_name", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_bank_account_name">
                    Nama Pemilik Rekening
                  </Label>
                  <Input
                    id="billing_bank_account_name"
                    value={form.billing_bank_account_name}
                    onChange={(e) =>
                      handleField("billing_bank_account_name", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_bank_account_no">
                    Nomor Rekening
                  </Label>
                  <Input
                    id="billing_bank_account_no"
                    value={form.billing_bank_account_no}
                    onChange={(e) =>
                      handleField("billing_bank_account_no", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pic_penagihan_name">
                    Nama Kontak Penagihan
                  </Label>
                  <Input
                    id="pic_penagihan_name"
                    value={form.pic_penagihan_name}
                    onChange={(e) =>
                      handleField("pic_penagihan_name", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pic_penagihan_phone">
                    Telepon Kontak Penagihan
                  </Label>
                  <Input
                    id="pic_penagihan_phone"
                    value={form.pic_penagihan_phone}
                    onChange={(e) =>
                      handleField("pic_penagihan_phone", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="kerja_sama_notes">Catatan Internal</Label>
                  <Textarea
                    id="kerja_sama_notes"
                    placeholder="Mis. Disepakati per meeting 5 Sept 2026"
                    value={form.kerja_sama_notes}
                    onChange={(e) =>
                      handleField("kerja_sama_notes", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/kerja-sama/akun")}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Aktifkan Akun"
                )}
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

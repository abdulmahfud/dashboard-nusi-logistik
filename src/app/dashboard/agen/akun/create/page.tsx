"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { useAuth } from "@/context/AuthContext";
import { createAgenAccount, getUsers } from "@/lib/apiClient";
import type { CreateAgenAccountPayload } from "@/types/agenAkun";
import type { User } from "@/types/users";
import { AxiosError } from "axios";
import {
  Building2,
  CreditCard,
  Loader2,
  Save,
  Search,
  UserSearch,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-800";

export default function CreateAgenAkunPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();

  const [submitting, setSubmitting] = useState(false);

  // Pencarian user yang sudah ada
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [searchingUser, setSearchingUser] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const userInputRef = useRef<HTMLDivElement>(null);
  const userInputElRef = useRef<HTMLInputElement>(null);
  // Penomoran request pencarian — biar respons yang datang belakangan tidak
  // pernah ditimpa oleh respons lama yang baru sampai duluan (race condition).
  const searchSeqRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    company_name: "",
    company_legality_no: "",
    npwp: "",
    pic_name: "",
    pic_ktp_no: "",
    billing_address: "",
    billing_phone: "",
    billing_email: "",
    billing_bank_name: "",
    billing_bank_account_name: "",
    billing_bank_account_no: "",
    pic_penagihan_name: "",
    pic_penagihan_phone: "",
    kerja_sama_notes: "",
  });

  useEffect(() => {
    if (!authLoading && !hasPermission("agen-accounts.create")) {
      router.replace("/dashboard/agen/akun");
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

  const runUserSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setUserResults([]);
      setSearchAttempted(false);
      return;
    }
    const seq = ++searchSeqRef.current;
    setSearchingUser(true);
    getUsers({ search: trimmed, per_page: 10 })
      .then((res) => {
        if (seq !== searchSeqRef.current) return; // respons basi, abaikan
        setUserResults(res.data.data);
        setShowResults(true);
        setSearchAttempted(true);
      })
      .catch(() => {
        if (seq !== searchSeqRef.current) return;
        setUserResults([]);
        setSearchAttempted(true);
      })
      .finally(() => {
        if (seq === searchSeqRef.current) setSearchingUser(false);
      });
  }, []);

  // Pencarian manual (klik tombol / Enter) — baca langsung value dari DOM
  // supaya tidak pernah kepakai state yang lama (mis. setelah paste cepat),
  // dan batalkan debounce yang mungkin masih tertunda.
  const triggerManualSearch = useCallback(() => {
    const liveValue = userInputElRef.current?.value ?? userQuery;
    runUserSearch(liveValue);
  }, [runUserSearch, userQuery]);

  useEffect(() => {
    if (userQuery.trim().length < 3 || selectedUser) {
      setUserResults([]);
      setSearchAttempted(false);
      return;
    }
    debounceRef.current = setTimeout(() => runUserSearch(userQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [userQuery, selectedUser, runUserSearch]);

  const handleField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setUserQuery(`${user.name} (${user.email})`);
    setShowResults(false);
    setSearchAttempted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error("Pilih user yang sudah terdaftar terlebih dahulu.");
      return;
    }
    if (!form.company_name.trim() || !form.pic_name.trim()) {
      toast.error("Nama perusahaan dan nama PIC wajib diisi.");
      return;
    }

    const payload: CreateAgenAccountPayload = {
      user_id: selectedUser.id,
      company_name: form.company_name,
      pic_name: form.pic_name,
    };
    if (form.company_legality_no)
      payload.company_legality_no = form.company_legality_no;
    if (form.npwp) payload.npwp = form.npwp;
    if (form.pic_ktp_no) payload.pic_ktp_no = form.pic_ktp_no;
    if (form.billing_address) payload.billing_address = form.billing_address;
    if (form.billing_phone) payload.billing_phone = form.billing_phone;
    if (form.billing_email) payload.billing_email = form.billing_email;
    if (form.billing_bank_name)
      payload.billing_bank_name = form.billing_bank_name;
    if (form.billing_bank_account_name)
      payload.billing_bank_account_name = form.billing_bank_account_name;
    if (form.billing_bank_account_no)
      payload.billing_bank_account_no = form.billing_bank_account_no;
    if (form.pic_penagihan_name)
      payload.pic_penagihan_name = form.pic_penagihan_name;
    if (form.pic_penagihan_phone)
      payload.pic_penagihan_phone = form.pic_penagihan_phone;
    if (form.kerja_sama_notes) payload.kerja_sama_notes = form.kerja_sama_notes;

    setSubmitting(true);
    try {
      await createAgenAccount(payload);
      toast.success("Akun agen berhasil diaktifkan.");
      router.push(`/dashboard/agen/akun/${selectedUser.id}`);
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
          toast.error(data.message || "Gagal mengaktifkan akun agen.");
        }
      } else {
        toast.error("Gagal mengaktifkan akun agen.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;
  if (!hasPermission("agen-accounts.create")) return null;

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
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Akun Agen", href: "/dashboard/agen/akun" },
              { label: "Aktifkan Akun" },
            ]}
            back={{ href: "/dashboard/agen/akun" }}
            title="Aktifkan Akun Agen"
            description="Akun agen bersifat prepaid — order dibayar dari saldo wallet, tidak ada limit kredit/invoice bulanan."
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <SectionCard icon={UserSearch} title="1. Pilih User">
              <div className="relative" ref={userInputRef}>
                <Label htmlFor="user-search" className={labelCls}>
                  Cari user terdaftar (nama/email){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="mt-1 flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="user-search"
                      ref={userInputElRef}
                      placeholder="Ketik minimal 3 huruf, lalu Enter atau klik cari…"
                      value={userQuery}
                      onChange={(e) => {
                        setUserQuery(e.target.value);
                        setSelectedUser(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          triggerManualSearch();
                        }
                      }}
                      autoComplete="off"
                      className={fieldCls}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={triggerManualSearch}
                    disabled={searchingUser}
                    className="h-11 w-11 shrink-0 rounded-lg border-slate-200 p-0"
                  >
                    {searchingUser ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {showResults && userResults.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {userResults.map((u) => (
                      <div
                        key={u.id}
                        className="cursor-pointer border-b border-slate-100 p-3 last:border-b-0 hover:bg-blue-50"
                        onClick={() => handleSelectUser(u)}
                      >
                        <p className="text-sm font-medium text-slate-900">
                          {u.name}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!searchingUser &&
                  searchAttempted &&
                  userResults.length === 0 &&
                  !selectedUser && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-lg">
                      Tidak ada user terdaftar yang cocok dengan &quot;
                      {userQuery.trim()}&quot;.
                    </div>
                  )}
                {selectedUser && (
                  <p className="mt-2 text-sm text-emerald-700">
                    Terpilih: {selectedUser.name} ({selectedUser.email})
                  </p>
                )}
              </div>
            </SectionCard>

            <SectionCard icon={Building2} title="2. Data Perusahaan & PIC">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className={labelCls}>
                    Nama Perusahaan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(e) =>
                      handleField("company_name", e.target.value)
                    }
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pic_name" className={labelCls}>
                    Nama PIC <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pic_name"
                    value={form.pic_name}
                    onChange={(e) => handleField("pic_name", e.target.value)}
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_legality_no" className={labelCls}>
                    No. Legalitas (NIB/SIUP)
                  </Label>
                  <Input
                    id="company_legality_no"
                    value={form.company_legality_no}
                    onChange={(e) =>
                      handleField("company_legality_no", e.target.value)
                    }
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="npwp" className={labelCls}>
                    NPWP
                  </Label>
                  <Input
                    id="npwp"
                    value={form.npwp}
                    onChange={(e) => handleField("npwp", e.target.value)}
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pic_ktp_no" className={labelCls}>
                    No. KTP PIC
                  </Label>
                  <Input
                    id="pic_ktp_no"
                    value={form.pic_ktp_no}
                    onChange={(e) =>
                      handleField("pic_ktp_no", e.target.value)
                    }
                    className={fieldCls}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={CreditCard}
              title="3. Data Penagihan"
              description="Opsional"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="billing_address" className={labelCls}>
                    Alamat Penagihan
                  </Label>
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
                    <Label htmlFor="billing_phone" className={labelCls}>
                      Telepon Penagihan
                    </Label>
                    <Input
                      id="billing_phone"
                      value={form.billing_phone}
                      onChange={(e) =>
                        handleField("billing_phone", e.target.value)
                      }
                      className={fieldCls}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing_email" className={labelCls}>
                      Email Penagihan
                    </Label>
                    <Input
                      id="billing_email"
                      type="email"
                      value={form.billing_email}
                      onChange={(e) =>
                        handleField("billing_email", e.target.value)
                      }
                      className={fieldCls}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_bank_name" className={labelCls}>
                    Nama Bank
                  </Label>
                  <Input
                    id="billing_bank_name"
                    value={form.billing_bank_name}
                    onChange={(e) =>
                      handleField("billing_bank_name", e.target.value)
                    }
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="billing_bank_account_name"
                    className={labelCls}
                  >
                    Nama Pemilik Rekening
                  </Label>
                  <Input
                    id="billing_bank_account_name"
                    value={form.billing_bank_account_name}
                    onChange={(e) =>
                      handleField("billing_bank_account_name", e.target.value)
                    }
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="billing_bank_account_no"
                    className={labelCls}
                  >
                    Nomor Rekening
                  </Label>
                  <Input
                    id="billing_bank_account_no"
                    value={form.billing_bank_account_no}
                    onChange={(e) =>
                      handleField("billing_bank_account_no", e.target.value)
                    }
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pic_penagihan_name" className={labelCls}>
                    Nama Kontak Penagihan
                  </Label>
                  <Input
                    id="pic_penagihan_name"
                    value={form.pic_penagihan_name}
                    onChange={(e) =>
                      handleField("pic_penagihan_name", e.target.value)
                    }
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pic_penagihan_phone" className={labelCls}>
                    Telepon Kontak Penagihan
                  </Label>
                  <Input
                    id="pic_penagihan_phone"
                    value={form.pic_penagihan_phone}
                    onChange={(e) =>
                      handleField("pic_penagihan_phone", e.target.value)
                    }
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="kerja_sama_notes" className={labelCls}>
                    Catatan Internal
                  </Label>
                  <Textarea
                    id="kerja_sama_notes"
                    placeholder="Mis. Disepakati per meeting 14 Sept 2026"
                    value={form.kerja_sama_notes}
                    onChange={(e) =>
                      handleField("kerja_sama_notes", e.target.value)
                    }
                  />
                </div>
              </div>
            </SectionCard>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg border-slate-200"
                onClick={() => router.push("/dashboard/agen/akun")}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden />
                    Aktifkan Akun
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

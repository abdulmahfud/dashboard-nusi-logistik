"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { formatDateIdLong } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import {
  getKerjaSamaAccount,
  getKerjaSamaLedger,
  recordKerjaSamaPayment,
  toggleKerjaSamaActive,
  updateKerjaSamaAccount,
  updateKerjaSamaCreditLimit,
} from "@/lib/apiClient";
import {
  KERJA_SAMA_LEDGER_STATUS_LABEL,
  KERJA_SAMA_LEDGER_TYPE_LABEL,
  type KerjaSamaAccount,
  type KerjaSamaLedgerEntry,
} from "@/types/kerjaSama";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Ban,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Handshake,
  Loader2,
  Pencil,
  Wallet,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    if (data?.errors) return Object.values(data.errors).flat()[0] || fallback;
    return data?.message || fallback;
  }
  return fallback;
}

export default function KerjaSamaAkunDetailPage() {
  const params = useParams();
  const userId = Number(params.id);
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();

  const [account, setAccount] = useState<KerjaSamaAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit profile
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    account_type: "corporate" as "personal" | "corporate",
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
    pic_penagihan_name: "",
    pic_penagihan_phone: "",
    kerja_sama_notes: "",
  });

  // Credit limit
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditSaving, setCreditSaving] = useState(false);
  const [creditForm, setCreditForm] = useState({
    credit_limit: "",
    max_outstanding: "",
    billing_term_days: "30",
  });

  // Suspend / activate
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendSaving, setSuspendSaving] = useState(false);

  // Record payment
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    description: "",
  });

  // Ledger
  const [ledger, setLedger] = useState<KerjaSamaLedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLastPage, setLedgerLastPage] = useState(1);
  const [ledgerType, setLedgerType] = useState("all");
  const [ledgerStatus, setLedgerStatus] = useState("all");
  const [outstanding, setOutstanding] = useState<number | null>(null);

  const canUpdate = hasPermission("kerja-sama.accounts.update");
  const canManageCredit = hasPermission("kerja-sama.accounts.manage-credit");
  const canSuspend = hasPermission("kerja-sama.accounts.suspend");

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getKerjaSamaAccount(userId);
      setAccount(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat detail akun kerja sama."));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchLedger = useCallback(
    async (page = 1) => {
      setLedgerLoading(true);
      try {
        const res = await getKerjaSamaLedger(userId, {
          page,
          type: ledgerType === "all" ? undefined : ledgerType,
          status: ledgerStatus === "all" ? undefined : ledgerStatus,
        });
        setLedger(res.data.data);
        setLedgerPage(res.data.current_page);
        setLedgerLastPage(res.data.last_page);
        setOutstanding(res.outstanding_balance);
      } catch {
        setLedger([]);
      } finally {
        setLedgerLoading(false);
      }
    },
    [userId, ledgerType, ledgerStatus]
  );

  useEffect(() => {
    if (!authLoading && !hasPermission("kerja-sama.accounts.view")) {
      router.replace("/dashboard/kerja-sama/akun");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!authLoading && hasPermission("kerja-sama.accounts.view")) {
      void fetchAccount();
      void fetchLedger(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, hasPermission]);

  useEffect(() => {
    if (!authLoading && hasPermission("kerja-sama.accounts.view")) {
      void fetchLedger(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerType, ledgerStatus]);

  const openEdit = () => {
    if (!account) return;
    setEditForm({
      account_type: account.account_type,
      company_name: account.company_name || "",
      company_legality_no: account.company_legality_no || "",
      npwp: account.npwp || "",
      pic_name: account.pic_name || "",
      pic_ktp_no: account.pic_ktp_no || "",
      ktp_no: account.ktp_no || "",
      billing_address: account.billing_address || "",
      billing_phone: account.billing_phone || "",
      billing_email: account.billing_email || "",
      billing_bank_name: account.billing_bank_name || "",
      billing_bank_account_name: account.billing_bank_account_name || "",
      billing_bank_account_no: account.billing_bank_account_no || "",
      pic_penagihan_name: account.pic_penagihan_name || "",
      pic_penagihan_phone: account.pic_penagihan_phone || "",
      kerja_sama_notes: account.kerja_sama_notes || "",
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    setEditSaving(true);
    try {
      await updateKerjaSamaAccount(userId, editForm);
      toast.success("Data akun berhasil diperbarui.");
      setEditOpen(false);
      await fetchAccount();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memperbarui data akun."));
    } finally {
      setEditSaving(false);
    }
  };

  const openCredit = () => {
    if (!account) return;
    setCreditForm({
      credit_limit: String(account.credit_limit ?? ""),
      max_outstanding:
        account.max_outstanding != null ? String(account.max_outstanding) : "",
      billing_term_days: String(account.billing_term_days ?? 30),
    });
    setCreditOpen(true);
  };

  const submitCredit = async () => {
    if (!creditForm.credit_limit || Number(creditForm.credit_limit) < 0) {
      toast.error("Limit kredit wajib diisi (angka ≥ 0).");
      return;
    }
    setCreditSaving(true);
    try {
      await updateKerjaSamaCreditLimit(userId, {
        credit_limit: Number(creditForm.credit_limit),
        max_outstanding: creditForm.max_outstanding
          ? Number(creditForm.max_outstanding)
          : undefined,
        billing_term_days: creditForm.billing_term_days
          ? Number(creditForm.billing_term_days)
          : undefined,
      });
      toast.success("Limit kredit berhasil diperbarui.");
      setCreditOpen(false);
      await fetchAccount();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memperbarui limit kredit."));
    } finally {
      setCreditSaving(false);
    }
  };

  const submitToggleActive = async () => {
    setSuspendSaving(true);
    try {
      const isActivating = account?.kerja_sama_is_active === false;
      const res = await toggleKerjaSamaActive(
        userId,
        isActivating ? undefined : { reason: suspendReason || undefined }
      );
      toast.success(res.message || "Status akun berhasil diperbarui.");
      setSuspendOpen(false);
      setSuspendReason("");
      await fetchAccount();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengubah status akun."));
    } finally {
      setSuspendSaving(false);
    }
  };

  const submitPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error("Nominal pembayaran wajib diisi (> 0).");
      return;
    }
    setPaymentSaving(true);
    try {
      const res = await recordKerjaSamaPayment(userId, {
        amount: Number(paymentForm.amount),
        description: paymentForm.description || undefined,
      });
      toast.success("Pembayaran berhasil dicatat.");
      setOutstanding(res.data.outstanding_balance);
      setPaymentOpen(false);
      setPaymentForm({ amount: "", description: "" });
      await fetchAccount();
      await fetchLedger(1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mencatat pembayaran."));
    } finally {
      setPaymentSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex min-h-[40vh] items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Memuat…</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!hasPermission("kerja-sama.accounts.view")) return null;

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
                {account?.company_name || account?.name || "Akun Kerja Sama"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {account?.email}
              </p>
            </div>
          </div>

          {error ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : account ? (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Profil */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Profil</CardTitle>
                    {canUpdate && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={openEdit}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipe Akun</span>
                      <Badge variant="outline" className="capitalize">
                        {account.account_type}
                      </Badge>
                    </div>
                    {account.account_type === "corporate" ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Nama PIC
                          </span>
                          <span>{account.pic_name || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NPWP</span>
                          <span>{account.npwp || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            No. Legalitas
                          </span>
                          <span>{account.company_legality_no || "—"}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">No. KTP</span>
                        <span>{account.ktp_no || "—"}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Alamat Penagihan
                      </span>
                      <span className="max-w-[60%] text-right">
                        {account.billing_address || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Telepon / Email Penagihan
                      </span>
                      <span className="max-w-[60%] text-right">
                        {account.billing_phone || "—"}
                        {account.billing_email
                          ? ` · ${account.billing_email}`
                          : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Rekening Bank
                      </span>
                      <span className="max-w-[60%] text-right">
                        {account.billing_bank_name
                          ? `${account.billing_bank_name} · ${
                              account.billing_bank_account_no || "-"
                            } a.n ${account.billing_bank_account_name || "-"}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Kontak Penagihan
                      </span>
                      <span className="max-w-[60%] text-right">
                        {account.pic_penagihan_name || "—"}
                        {account.pic_penagihan_phone
                          ? ` (${account.pic_penagihan_phone})`
                          : ""}
                      </span>
                    </div>
                    {account.kerja_sama_notes && (
                      <div className="rounded-md bg-slate-50 p-2 text-xs text-muted-foreground">
                        {account.kerja_sama_notes}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Kredit & Status */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Kredit & Status</CardTitle>
                    {account.kerja_sama_is_active ? (
                      <Badge className="border-green-200 bg-green-100 text-green-800">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge className="border-red-200 bg-red-100 text-red-800">
                        Nonaktif
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Limit Kredit
                      </span>
                      <span className="font-medium">
                        {formatRupiah(account.credit_limit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Max Outstanding
                      </span>
                      <span>
                        {account.max_outstanding != null
                          ? formatRupiah(account.max_outstanding)
                          : "Sama dengan limit kredit"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Outstanding Saat Ini
                      </span>
                      <span className="font-semibold text-blue-700">
                        {formatRupiah(
                          outstanding ?? account.outstanding_balance ?? 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Termin Pembayaran
                      </span>
                      <span>{account.billing_term_days} hari</span>
                    </div>
                    {account.suspended_at && (
                      <div className="rounded-md bg-red-50 p-2 text-xs text-red-800">
                        Disuspend {formatDateIdLong(account.suspended_at)}
                        {account.suspended_reason
                          ? `: ${account.suspended_reason}`
                          : ""}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-3">
                      {canManageCredit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={openCredit}
                        >
                          <Pencil className="h-4 w-4" />
                          Ubah Limit
                        </Button>
                      )}
                      {canManageCredit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => setPaymentOpen(true)}
                        >
                          <CircleDollarSign className="h-4 w-4" />
                          Catat Pembayaran
                        </Button>
                      )}
                      {canSuspend && (
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            account.kerja_sama_is_active
                              ? "destructive"
                              : "default"
                          }
                          className="gap-2"
                          onClick={() => setSuspendOpen(true)}
                        >
                          <Ban className="h-4 w-4" />
                          {account.kerja_sama_is_active
                            ? "Suspend"
                            : "Aktifkan Kembali"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ledger */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5" />
                    Riwayat Transaksi Kredit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Select value={ledgerType} onValueChange={setLedgerType}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Tipe</SelectItem>
                        <SelectItem value="charge">Tagihan</SelectItem>
                        <SelectItem value="adjustment">Penyesuaian</SelectItem>
                        <SelectItem value="payment">Pembayaran</SelectItem>
                        <SelectItem value="write_off">Hapus Buku</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={ledgerStatus} onValueChange={setLedgerStatus}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="pending">Belum Sampai</SelectItem>
                        <SelectItem value="confirmed">
                          Terkonfirmasi
                        </SelectItem>
                        <SelectItem value="invoiced">
                          Sudah Ditagih
                        </SelectItem>
                        <SelectItem value="voided">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {ledgerLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Memuat…
                    </div>
                  ) : ledger.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      Belum ada transaksi.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Tipe</TableHead>
                              <TableHead>Deskripsi</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Nominal
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ledger.map((entry) => {
                              const amount = Number(entry.amount);
                              const isNegative = amount < 0;
                              return (
                                <TableRow key={entry.id}>
                                  <TableCell className="whitespace-nowrap text-sm">
                                    {formatDateIdLong(entry.created_at)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {KERJA_SAMA_LEDGER_TYPE_LABEL[
                                        entry.type
                                      ] ?? entry.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[280px] truncate text-sm">
                                    {entry.description || "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {KERJA_SAMA_LEDGER_STATUS_LABEL[
                                        entry.status
                                      ] ?? entry.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell
                                    className={`text-right font-medium tabular-nums ${
                                      isNegative
                                        ? "text-green-700"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {isNegative ? "-" : "+"}
                                    {formatRupiah(Math.abs(amount))}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
                        <span>
                          Halaman {ledgerPage} dari {ledgerLastPage}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fetchLedger(ledgerPage - 1)}
                            disabled={ledgerPage <= 1 || ledgerLoading}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fetchLedger(ledgerPage + 1)}
                            disabled={
                              ledgerPage >= ledgerLastPage || ledgerLoading
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Dialog: Edit Profile */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-2xl">
            <DialogHeader className="shrink-0 text-left">
              <DialogTitle>Edit Profil Akun</DialogTitle>
              <DialogDescription>
                Tidak mengubah limit kredit / status aktif — pakai aksi
                terpisah untuk itu.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-2">
              <RadioGroup
                value={editForm.account_type}
                onValueChange={(v) =>
                  setEditForm((p) => ({
                    ...p,
                    account_type: v as "personal" | "corporate",
                  }))
                }
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="edit-type-corporate"
                  className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer ${
                    editForm.account_type === "corporate"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem
                    id="edit-type-corporate"
                    value="corporate"
                  />
                  Corporate
                </Label>
                <Label
                  htmlFor="edit-type-personal"
                  className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer ${
                    editForm.account_type === "personal"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem id="edit-type-personal" value="personal" />
                  Personal
                </Label>
              </RadioGroup>

              {editForm.account_type === "corporate" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Nama Perusahaan</Label>
                    <Input
                      value={editForm.company_name}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          company_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Nama PIC</Label>
                    <Input
                      value={editForm.pic_name}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          pic_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>No. Legalitas</Label>
                    <Input
                      value={editForm.company_legality_no}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          company_legality_no: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>NPWP</Label>
                    <Input
                      value={editForm.npwp}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, npwp: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1 sm:w-1/2">
                  <Label>No. KTP</Label>
                  <Input
                    value={editForm.ktp_no}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, ktp_no: e.target.value }))
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Alamat Penagihan</Label>
                  <Textarea
                    value={editForm.billing_address}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        billing_address: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Telepon Penagihan</Label>
                  <Input
                    value={editForm.billing_phone}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        billing_phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Email Penagihan</Label>
                  <Input
                    value={editForm.billing_email}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        billing_email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nama Bank</Label>
                  <Input
                    value={editForm.billing_bank_name}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        billing_bank_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nama Pemilik Rekening</Label>
                  <Input
                    value={editForm.billing_bank_account_name}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        billing_bank_account_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nomor Rekening</Label>
                  <Input
                    value={editForm.billing_bank_account_no}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        billing_bank_account_no: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nama Kontak Penagihan</Label>
                  <Input
                    value={editForm.pic_penagihan_name}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        pic_penagihan_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Telepon Kontak Penagihan</Label>
                  <Input
                    value={editForm.pic_penagihan_phone}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        pic_penagihan_phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Catatan Internal</Label>
                  <Textarea
                    value={editForm.kerja_sama_notes}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        kerja_sama_notes: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={editSaving}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void submitEdit()}
                disabled={editSaving}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {editSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Ubah Limit Kredit */}
        <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ubah Limit Kredit</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Limit Kredit (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  value={creditForm.credit_limit}
                  onChange={(e) =>
                    setCreditForm((p) => ({
                      ...p,
                      credit_limit: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Max Outstanding (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  value={creditForm.max_outstanding}
                  onChange={(e) =>
                    setCreditForm((p) => ({
                      ...p,
                      max_outstanding: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Termin Pembayaran (hari)</Label>
                <Input
                  type="number"
                  min={1}
                  value={creditForm.billing_term_days}
                  onChange={(e) =>
                    setCreditForm((p) => ({
                      ...p,
                      billing_term_days: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreditOpen(false)}
                disabled={creditSaving}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void submitCredit()}
                disabled={creditSaving}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {creditSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Suspend / Aktifkan */}
        <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {account?.kerja_sama_is_active
                  ? "Suspend akun ini?"
                  : "Aktifkan kembali akun ini?"}
              </DialogTitle>
              <DialogDescription>
                {account?.kerja_sama_is_active
                  ? "Order baru dari akun ini akan ditolak sampai diaktifkan kembali. Order yang sudah berjalan tidak terpengaruh."
                  : "Akun akan bisa membuat order kredit kembali."}
              </DialogDescription>
            </DialogHeader>
            {account?.kerja_sama_is_active && (
              <div className="space-y-1">
                <Label>Alasan (opsional)</Label>
                <Textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Mis. Tagihan belum lunas > 30 hari"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSuspendOpen(false)}
                disabled={suspendSaving}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant={
                  account?.kerja_sama_is_active ? "destructive" : "default"
                }
                onClick={() => void submitToggleActive()}
                disabled={suspendSaving}
              >
                {suspendSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : account?.kerja_sama_is_active ? (
                  "Ya, Suspend"
                ) : (
                  "Ya, Aktifkan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Catat Pembayaran */}
        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Catat Pembayaran Manual</DialogTitle>
              <DialogDescription>
                Untuk transfer dari customer di luar sistem. Mengurangi
                outstanding balance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nominal (Rp)</Label>
                <Input
                  type="number"
                  min={1}
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((p) => ({ ...p, amount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Keterangan</Label>
                <Textarea
                  value={paymentForm.description}
                  onChange={(e) =>
                    setPaymentForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mis. Transfer BCA 9 Sept 2026"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentOpen(false)}
                disabled={paymentSaving}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => void submitPayment()}
                disabled={paymentSaving}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {paymentSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

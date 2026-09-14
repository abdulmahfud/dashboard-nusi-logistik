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
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { getAgenAccount, updateAgenAccount } from "@/lib/apiClient";
import type { AgenAccount } from "@/types/agenAkun";
import { AxiosError } from "axios";
import { ArrowLeft, Loader2, Pencil, Store } from "lucide-react";
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

export default function AgenAkunDetailPage() {
  const params = useParams();
  const userId = Number(params.id);
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();

  const [account, setAccount] = useState<AgenAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
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

  const canUpdate = hasPermission("agen-accounts.update");

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAgenAccount(userId);
      setAccount(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat detail akun agen."));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading && !hasPermission("agen-accounts.view")) {
      router.replace("/dashboard/agen/akun");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!authLoading && hasPermission("agen-accounts.view")) {
      void fetchAccount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, hasPermission]);

  const openEdit = () => {
    if (!account) return;
    setEditForm({
      company_name: account.company_name || "",
      company_legality_no: account.company_legality_no || "",
      npwp: account.npwp || "",
      pic_name: account.pic_name || "",
      pic_ktp_no: account.pic_ktp_no || "",
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
      await updateAgenAccount(userId, editForm);
      toast.success("Data akun berhasil diperbarui.");
      setEditOpen(false);
      await fetchAccount();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memperbarui data akun."));
    } finally {
      setEditSaving(false);
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

  if (!hasPermission("agen-accounts.view")) return null;

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
              onClick={() => router.push("/dashboard/agen/akun")}
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                <Store className="h-6 w-6 text-blue-600" />
                {account?.company_name || account?.name || "Akun Agen"}
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Profil</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    Agen · Prepaid
                  </Badge>
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
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama PIC</span>
                  <span>{account.pic_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NPWP</span>
                  <span>{account.npwp || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Legalitas</span>
                  <span>{account.company_legality_no || "—"}</span>
                </div>
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
                    {account.billing_email ? ` · ${account.billing_email}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rekening Bank</span>
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
                <div className="rounded-md bg-blue-50 p-2 text-xs text-blue-800">
                  Akun agen membayar order lewat saldo wallet saja — tidak ada
                  limit kredit/invoice bulanan.
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Dialog: Edit Profile */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-2xl">
            <DialogHeader className="shrink-0 text-left">
              <DialogTitle>Edit Profil Akun Agen</DialogTitle>
              <DialogDescription>
                Data profil bisnis dan penagihan. Tipe akun tetap agen/prepaid.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-2">
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
                      setEditForm((p) => ({ ...p, pic_name: e.target.value }))
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
                <div className="space-y-1">
                  <Label>No. KTP PIC</Label>
                  <Input
                    value={editForm.pic_ktp_no}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        pic_ktp_no: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

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
      </SidebarInset>
    </SidebarProvider>
  );
}

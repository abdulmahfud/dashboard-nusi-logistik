"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { updateOrder } from "@/lib/apiClient";
import { AxiosError } from "axios";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/types/laporanPengiriman";
import { getDetail } from "./orderDetail";

interface Props {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";

/** Edit field terbatas (penerima + catatan) untuk order belum diproses. */
export default function EditOrderDialog({ order, onOpenChange, onSaved }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [regency, setRegency] = useState("");
  const [district, setDistrict] = useState("");
  const [instruction, setInstruction] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!order) return;
    setName(order.receiver?.name ?? "");
    setPhone(order.receiver?.phone ?? "");
    setAddress(order.receiver?.address ?? "");
    setProvince("");
    setRegency("");
    setDistrict("");
    setInstruction(getDetail(order).instruction ?? "");
  }, [order]);

  const handleSave = async () => {
    if (!order) return;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Nama, telepon, dan alamat penerima wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateOrder(order.id, {
        receiver: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          province: province.trim() || undefined,
          regency: regency.trim() || undefined,
          district: district.trim() || undefined,
        },
        instruction: instruction.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.message || "Gagal menyimpan perubahan.");
        return;
      }

      toast.success("Paket diperbarui.");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string } | undefined)?.message
          : undefined;
      toast.error(message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-slate-100 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Pencil className="h-5 w-5" aria-hidden />
            </span>
            <div className="text-left">
              <DialogTitle>Edit Paket #{order?.id}</DialogTitle>
              <DialogDescription>
                Ubah data penerima atau catatan sebelum paket diproses.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Nama Penerima
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldCls}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Telepon Penerima
          </Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldCls}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Alamat Penerima
          </Label>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="rounded-lg border-slate-200 bg-white"
          />
          <p className="text-xs text-slate-400">
            Perubahan alamat tidak mengubah provinsi/kota/kecamatan yang
            sudah tersimpan kecuali diisi ulang di bawah.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Provinsi
            </Label>
            <Input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="(tetap)"
              className={fieldCls}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Kota/Kab.
            </Label>
            <Input
              value={regency}
              onChange={(e) => setRegency(e.target.value)}
              placeholder="(tetap)"
              className={fieldCls}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Kecamatan
            </Label>
            <Input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="(tetap)"
              className={fieldCls}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Catatan / Instruksi
          </Label>
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={2}
            className="rounded-lg border-slate-200 bg-white"
          />
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Berat, dimensi, nilai barang, dan COD tidak bisa diubah di sini
          (mempengaruhi biaya kirim yang sudah dihitung). Untuk mengubahnya,
          buat paket baru.
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg border-slate-200"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Batal
          </Button>
          <Button
            type="button"
            className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

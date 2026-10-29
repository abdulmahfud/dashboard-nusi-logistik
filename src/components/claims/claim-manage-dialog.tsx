"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updatePackageClaim } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { CLAIM_STATUS_OPTIONS } from "@/lib/packageClaimUi";
import type { PackageClaim } from "@/types/packageClaim";

type Props = {
  claim: PackageClaim;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (updated: PackageClaim) => void;
};

function unwrapClaimDetail(raw: unknown): PackageClaim | null {
  if (!raw || typeof raw !== "object") return null;
  const data = (raw as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  return data as PackageClaim;
}

/** Dialog kecil khusus ubah status klaim (claims.manage) - dipicu dari halaman detail. */
export function ClaimManageDialog({ claim, open, onOpenChange, onUpdated }: Props) {
  const [status, setStatus] = useState(String(claim.status));
  const [rejectionReason, setRejectionReason] = useState(claim.rejection_reason ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(String(claim.status));
      setRejectionReason(claim.rejection_reason ?? "");
    }
  }, [open, claim]);

  const handleSave = async () => {
    if (status === "ditolak" && !rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const raw = await updatePackageClaim(claim.id, {
        status,
        rejection_reason: status === "ditolak" ? rejectionReason.trim() : null,
      });
      const updated = unwrapClaimDetail(raw);
      toast.success("Klaim diperbarui.");
      onOpenChange(false);
      if (updated) onUpdated(updated);
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal memperbarui klaim.")
          : "Gagal memperbarui klaim."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kelola klaim (admin)</DialogTitle>
          <DialogDescription>
            Ubah status klaim. Isi alasan kalau status diubah ke Ditolak.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="km-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="km-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLAIM_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status === "ditolak" && (
            <div className="space-y-2">
              <Label htmlFor="km-reason">Alasan Penolakan</Label>
              <Textarea
                id="km-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan…"
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

interface CancelOrderData {
  id: number;
  vendor: string;
  reference_no: string;
  awb_no: string;
  status: string;
  service_type_code: string;
  cod_value: string;
  item_value: string;
  shipment_type: string;
  shipper_name: string;
  receiver_name: string;
}

interface CancelOrderDialogProps {
  open: boolean;
  onClose: () => void;
  order: CancelOrderData;
  onSuccess: () => void;
}

export default function CancelOrderDialog({
  open,
  onClose,
  order,
  onSuccess,
}: CancelOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [remark, setRemark] = useState("Customer requested cancellation");

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      
      // Validasi AWB number
      if (!order.awb_no || order.awb_no.trim() === "") {
        throw new Error("AWB number tidak tersedia. Order tidak dapat dibatalkan.");
      }

      const vendorLower = order.vendor.toLowerCase();
      
      // Supported vendors sesuai dokumentasi
      const supportedVendors = [
        "anteraja",
        "jntexpress",
        "paxel",
        "posindonesia",
        "jne",
        "ninjaexpress",
        "idexpress",
        "jntcargo",
        "gosend",
        "lion",
        "sap",
      ];

      if (!supportedVendors.includes(vendorLower)) {
        throw new Error(`Vendor ${order.vendor} tidak didukung untuk cancel`);
      }

      // Format standar sesuai dokumentasi: menggunakan awb_no untuk semua vendor
      const url = `/admin/expedition/${vendorLower}/cancel`;
      const requestData: {
        awb_no: string;
        remark?: string;
      } = {
        awb_no: order.awb_no,
      };

      // Tambahkan remark jika ada (optional)
      if (remark.trim()) {
        requestData.remark = remark.trim();
      }

      const response = await apiClient.post(url, requestData);

      if (response.data.success) {
        toast.success("Pesanan berhasil dibatalkan");
        onSuccess();
      } else {
        throw new Error(response.data.message || "Gagal membatalkan pesanan");
      }
    } catch (error: unknown) {
      console.error("Error cancelling order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal membatalkan pesanan";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRemark("Customer requested cancellation");
    onClose();
  };

  const rp = (v: string) => `Rp${parseFloat(v).toLocaleString("id-ID")}`;

  const details: { label: string; value: React.ReactNode }[] = [
    {
      label: "Vendor",
      value: <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{order.vendor}</span>,
    },
    {
      label: "Reference No",
      value: <span className="font-mono text-xs">{order.reference_no}</span>,
    },
    {
      label: "AWB No",
      value: <span className="font-mono text-xs">{order.awb_no}</span>,
    },
    {
      label: "Status",
      value: (
        <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          {order.status.replace("_", " ").toUpperCase()}
        </span>
      ),
    },
    {
      label: "Service Type",
      value: <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{order.service_type_code}</span>,
    },
    { label: "COD Value", value: rp(order.cod_value) },
    { label: "Item Value", value: rp(order.item_value) },
    {
      label: "Shipment Type",
      value: (
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
            order.shipment_type === "DROPOFF"
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {order.shipment_type}
        </span>
      ),
    },
    { label: "Shipper", value: order.shipper_name },
    { label: "Receiver", value: order.receiver_name },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl border-slate-100 sm:max-w-lg">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3 pr-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <DialogTitle className="text-lg font-semibold leading-tight text-slate-900">
                Cancel {order.vendor} Order
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-500">
                Batalkan pesanan {order.vendor} berikut?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Details */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm">
            {details.map((d) => (
              <div key={d.label} className="min-w-0">
                <dt className="text-xs text-slate-500">{d.label}</dt>
                <dd className="mt-1 break-words font-medium text-slate-900">
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Remark Input */}
          <div className="space-y-2">
            <Label
              htmlFor="remark"
              className="text-sm font-medium text-slate-800"
            >
              Remark{" "}
              <span className="font-normal text-slate-400">(Opsional)</span>
            </Label>
            <Textarea
              id="remark"
              placeholder="Customer requested cancellation"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={isLoading}
              rows={2}
              maxLength={255}
              className="rounded-lg border-slate-200 bg-white"
            />
            <p className="text-xs text-slate-500">
              {remark.length}/255 karakter
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="h-10 rounded-lg border-slate-200"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-10 gap-2 rounded-lg"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ya, Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

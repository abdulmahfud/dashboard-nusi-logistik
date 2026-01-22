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
import { Badge } from "@/components/ui/badge";
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle>Cancel {order.vendor} Order</DialogTitle>
          </div>
          <DialogDescription>
            Batalkan pesanan {order.vendor} berikut?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Details */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Vendor:</span>
                <div>
                  <Badge variant="outline">{order.vendor}</Badge>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Reference No:</span>
                <div className="font-mono">{order.reference_no}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">AWB No:</span>
                <div className="font-mono">{order.awb_no}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Status:</span>
                <div>
                  <Badge variant="secondary">{order.status}</Badge>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Service Type:</span>
                <div>
                  <Badge variant="secondary">{order.service_type_code}</Badge>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">COD Value:</span>
                <div>
                  Rp{parseFloat(order.cod_value).toLocaleString("id-ID")}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Item Value:</span>
                <div>
                  Rp{parseFloat(order.item_value).toLocaleString("id-ID")}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  Shipment Type:
                </span>
                <div>
                  <Badge>{order.shipment_type}</Badge>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Shipper:</span>
                <div>{order.shipper_name}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Receiver:</span>
                <div>{order.receiver_name}</div>
              </div>
            </div>
          </div>

          {/* Remark Input */}
          <div className="space-y-2">
            <Label htmlFor="remark">Remark (Opsional)</Label>
            <Textarea
              id="remark"
              placeholder="Customer requested cancellation"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={isLoading}
              rows={2}
              maxLength={255}
            />
            <p className="text-xs text-gray-500">
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
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ya, Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

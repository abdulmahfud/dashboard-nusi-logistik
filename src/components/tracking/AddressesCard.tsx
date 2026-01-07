"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin } from "lucide-react";
import type { AddressInfo, ReceiverInfo } from "@/types/tracking";

interface AddressesCardProps {
  sender: AddressInfo;
  receiver: ReceiverInfo;
}

export const AddressesCard: React.FC<AddressesCardProps> = ({ sender, receiver }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pengirim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-semibold">{sender.name || "N/A"}</p>
            {sender.address && (
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {sender.address}
              </p>
            )}
            {sender.city && (
              <p className="text-sm">
                <strong>Kota:</strong> {sender.city}
              </p>
            )}
            {sender.province && (
              <p className="text-sm">
                <strong>Provinsi:</strong> {sender.province}
              </p>
            )}
            {sender.district && (
              <p className="text-sm">
                <strong>Kecamatan:</strong> {sender.district}
              </p>
            )}
            {(sender.postcode || sender.zipcode) && (
              <p className="text-sm">
                <strong>Kode Pos:</strong> {sender.postcode || sender.zipcode}
              </p>
            )}
            {sender.phone && (
              <p className="text-sm">
                <strong>Telepon:</strong> {sender.phone}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Penerima
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-semibold">{receiver.name || "N/A"}</p>
            {receiver.address && (
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {receiver.address}
              </p>
            )}
            {receiver.city && (
              <p className="text-sm">
                <strong>Kota:</strong> {receiver.city}
              </p>
            )}
            {receiver.province && (
              <p className="text-sm">
                <strong>Provinsi:</strong> {receiver.province}
              </p>
            )}
            {receiver.district && (
              <p className="text-sm">
                <strong>Kecamatan:</strong> {receiver.district}
              </p>
            )}
            {(receiver.postcode || receiver.zipcode) && (
              <p className="text-sm">
                <strong>Kode Pos:</strong> {receiver.postcode || receiver.zipcode}
              </p>
            )}
            {receiver.phone && (
              <p className="text-sm">
                <strong>Telepon:</strong> {receiver.phone}
              </p>
            )}
            {receiver.actual_receiver && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium text-gray-700">Penerima Aktual:</p>
                <p className="text-sm text-gray-900">{receiver.actual_receiver.name}</p>
                {receiver.actual_receiver.relationship && (
                  <p className="text-xs text-gray-600">
                    Hubungan: {receiver.actual_receiver.relationship}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

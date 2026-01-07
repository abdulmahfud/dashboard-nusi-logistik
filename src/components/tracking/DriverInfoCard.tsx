"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, User, Phone } from "lucide-react";
import type { DriverInfo } from "@/types/tracking";

interface DriverInfoCardProps {
  driverInfo: DriverInfo;
}

export const DriverInfoCard: React.FC<DriverInfoCardProps> = ({ driverInfo }) => {
  const hasPickupDriver = driverInfo.pickup_driver.name || driverInfo.pickup_driver.phone;
  const hasDeliveryDriver = driverInfo.delivery_driver.name || driverInfo.delivery_driver.phone;

  if (!hasPickupDriver && !hasDeliveryDriver) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {hasPickupDriver && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Driver Pickup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {driverInfo.pickup_driver.name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">{driverInfo.pickup_driver.name}</span>
              </div>
            )}
            {driverInfo.pickup_driver.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{driverInfo.pickup_driver.phone}</span>
              </div>
            )}
            {driverInfo.pickup_driver.photo && (
              <div className="mt-2">
                <a
                  href={driverInfo.pickup_driver.photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Lihat Foto Driver
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasDeliveryDriver && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Driver Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {driverInfo.delivery_driver.name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">{driverInfo.delivery_driver.name}</span>
              </div>
            )}
            {driverInfo.delivery_driver.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{driverInfo.delivery_driver.phone}</span>
              </div>
            )}
            {driverInfo.delivery_driver.photo && (
              <div className="mt-2">
                <a
                  href={driverInfo.delivery_driver.photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Lihat Foto Driver
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

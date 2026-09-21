"use client";

import { Phone, Truck, User } from "lucide-react";
import type { DriverInfo } from "@/types/tracking";
import { TrackCard } from "./tracking-ui";

interface DriverInfoCardProps {
  driverInfo: DriverInfo;
}

type Driver = DriverInfo["pickup_driver"];

function DriverCard({ title, driver }: { title: string; driver: Driver }) {
  return (
    <TrackCard icon={Truck} title={title}>
      <div className="space-y-2">
        {driver.name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" aria-hidden />
            <span className="font-semibold text-slate-900">{driver.name}</span>
          </div>
        )}
        {driver.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" aria-hidden />
            <span className="text-sm text-slate-600">{driver.phone}</span>
          </div>
        )}
        {driver.photo && (
          <a
            href={driver.photo}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Lihat Foto Driver
          </a>
        )}
      </div>
    </TrackCard>
  );
}

export const DriverInfoCard: React.FC<DriverInfoCardProps> = ({
  driverInfo,
}) => {
  const hasPickupDriver =
    driverInfo.pickup_driver.name || driverInfo.pickup_driver.phone;
  const hasDeliveryDriver =
    driverInfo.delivery_driver.name || driverInfo.delivery_driver.phone;

  if (!hasPickupDriver && !hasDeliveryDriver) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {hasPickupDriver && (
        <DriverCard title="Driver Pickup" driver={driverInfo.pickup_driver} />
      )}
      {hasDeliveryDriver && (
        <DriverCard
          title="Driver Delivery"
          driver={driverInfo.delivery_driver}
        />
      )}
    </div>
  );
};

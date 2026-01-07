"use client";

import type { StandardizedTrackingResponse } from "@/types/tracking";
import { OrderInfoCard } from "./OrderInfoCard";
import { ShipmentInfoCard } from "./ShipmentInfoCard";
import { AddressesCard } from "./AddressesCard";
import { TrackingHistoryCard } from "./TrackingHistoryCard";
import { CurrentStatusCard } from "./CurrentStatusCard";
import { DeliveryInfoCard } from "./DeliveryInfoCard";
import { DriverInfoCard } from "./DriverInfoCard";

interface TrackingDisplayProps {
  result: StandardizedTrackingResponse;
}

export const TrackingDisplay: React.FC<TrackingDisplayProps> = ({ result }) => {
  const { tracking_data } = result;

  return (
    <div className="space-y-6">
      <OrderInfoCard orderInfo={result.order_info} />

      {/* Current Status */}
      {tracking_data.current_status && (
        <CurrentStatusCard currentStatus={tracking_data.current_status} />
      )}

      {/* Shipment Info */}
      {tracking_data.shipment && (
        <ShipmentInfoCard shipment={tracking_data.shipment} />
      )}

      {/* Sender & Receiver */}
      {(tracking_data.sender || tracking_data.receiver) && (
        <AddressesCard
          sender={tracking_data.sender}
          receiver={tracking_data.receiver}
        />
      )}

      {/* Tracking History */}
      {tracking_data.tracking_history &&
        tracking_data.tracking_history.length > 0 && (
          <TrackingHistoryCard data={tracking_data.tracking_history} />
        )}

      {/* Delivery Info */}
      {tracking_data.delivery && (
        <DeliveryInfoCard delivery={tracking_data.delivery} />
      )}

      {/* Driver Info */}
      {tracking_data.driver_info && (
        <DriverInfoCard driverInfo={tracking_data.driver_info} />
      )}
    </div>
  );
};

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
  const safeOrderInfo = {
    reference_no: result.order_info?.reference_no ?? "-",
    vendor: result.order_info?.vendor ?? "-",
    awb_no: result.order_info?.awb_no ?? null,
    status: result.order_info?.status ?? "-",
    created_at: result.order_info?.created_at ?? new Date().toISOString(),
    user_id: result.order_info?.user_id ?? 0,
  };

  const safeCurrentStatus = tracking_data?.current_status ?? {
    code: null,
    status: null,
    description: null,
    timestamp: null,
    datetime: null,
  };

  const safeShipment = tracking_data?.shipment ?? {
    service_code: null,
    service_name: null,
    weight: null,
    weight_unit: "kg",
    pieces: 0,
    koli: 0,
    service_fee: null,
    shipping_cost: null,
    cod_value: 0,
    insurance_cost: 0,
    total_amount: null,
    booking_id: null,
    invoice_no: null,
    shipped_date: null,
    item_name: null,
  };

  const safeSender = tracking_data?.sender ?? {
    name: null,
    phone: null,
    address: null,
    postcode: null,
    city: null,
    province: null,
    district: null,
    zipcode: null,
  };

  const safeReceiver = tracking_data?.receiver ?? {
    ...safeSender,
    actual_receiver: null,
  };

  const safeHistory = Array.isArray(tracking_data?.tracking_history)
    ? tracking_data.tracking_history.map((h, idx) => ({
        sequence: h?.sequence ?? idx + 1,
        timestamp: h?.timestamp ?? null,
        datetime: h?.datetime ?? null,
        date_time: h?.date_time ?? null,
        status_code: h?.status_code ?? null,
        status: h?.status ?? null,
        status_name: h?.status_name ?? null,
        description: h?.description ?? null,
        message: h?.message ?? null,
        location: h?.location ?? {
          hub_name: null,
          city: null,
          city_name: null,
          province: null,
          district: null,
          branch_name: null,
          store_name: null,
          next_site: null,
          next_branch: null,
        },
        driver: h?.driver ?? {
          name: null,
          phone: null,
          photo: null,
        },
        recipient: h?.recipient ?? null,
        note: h?.note ?? null,
        image_url: h?.image_url ?? null,
      }))
    : [];

  const safeDelivery = tracking_data?.delivery ?? {
    estimated_delivery: null,
    delivered_at: null,
    delivered_to: null,
    delivery_relationship: null,
    pod_status_code: null,
    pod_status_name: null,
    proof_of_delivery: {
      signature_url: null,
      photo_url: null,
      signature_pod: [],
      photo_pod: [],
    },
  };

  const safeDriverInfo = tracking_data?.driver_info ?? {
    pickup_driver: { name: null, phone: null, photo: null },
    delivery_driver: { name: null, phone: null, photo: null },
  };

  return (
    <div className="space-y-6">
      <OrderInfoCard orderInfo={safeOrderInfo} />

      {/* Current Status */}
      <CurrentStatusCard currentStatus={safeCurrentStatus} />

      {/* Shipment Info */}
      <ShipmentInfoCard shipment={safeShipment} />

      {/* Sender & Receiver */}
      <AddressesCard sender={safeSender} receiver={safeReceiver} />

      {/* Tracking History */}
      {safeHistory.length > 0 && <TrackingHistoryCard data={safeHistory} />}

      {/* Delivery Info */}
      <DeliveryInfoCard delivery={safeDelivery} />

      {/* Driver Info */}
      <DriverInfoCard driverInfo={safeDriverInfo} />
    </div>
  );
};

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Delivery type values used in the frontend
 */
export type DeliveryType = "pickup" | "dropoff";

/**
 * Convert deliveryType string to pickup boolean
 * @param deliveryType - "pickup" or "dropoff"
 * @returns true if deliveryType is "pickup", false otherwise
 */
export function deliveryTypeToPickup(deliveryType: string | undefined | null): boolean {
  return deliveryType === "pickup";
}

/**
 * Convert pickup boolean to deliveryType string
 * @param pickup - boolean value
 * @returns "pickup" if true, "dropoff" if false
 */
export function pickupToDeliveryType(pickup: boolean): DeliveryType {
  return pickup ? "pickup" : "dropoff";
}
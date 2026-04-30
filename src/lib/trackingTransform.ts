import type { StandardizedTrackingResponse } from "@/types/tracking";
import {
  transformJneTrackingResponse,
  isJneRawResponse,
  type JneTrackingResponse,
} from "./jneTrackingTransform";
import {
  transformPosIndonesiaTrackingResponse,
  isPosIndonesiaRawResponse,
  type PosIndonesiaTrackingResponse,
} from "./posIndonesiaTrackingTransform";
import {
  transformAnterAjaTrackingResponse,
  isAnterAjaRawResponse,
  type AnterAjaTrackingResponse,
} from "./anterajaTrackingTransform";
import {
  transformSapTrackingResponse,
  isSapRawResponse,
  type SapTrackingResponse,
} from "./sapTrackingTransform";
import {
  transformJntTrackingResponse,
  isJntRawResponse,
  type JntTrackingResponse,
} from "./jntTrackingTransform";
import {
  transformLionTrackingResponse,
  isLionRawResponse,
  type LionTrackingResponse,
} from "./lionTrackingTransform";
import {
  transformIdexpressTrackingResponse,
  isIdexpressRawResponse,
  type IdexpressTrackingResponse,
} from "./idexpressTrackingTransform";

/**
 * Vendor transformer interface
 */
export interface VendorTransformer<T = unknown> {
  vendor: string;
  vendorName: string;
  detect: (data: unknown) => boolean;
  transform: (data: T, awbNo: string) => StandardizedTrackingResponse;
}

/**
 * Registry of vendor transformers
 */
const vendorTransformers: VendorTransformer[] = [
  {
    vendor: "jntexpress",
    vendorName: "J&T Express",
    detect: isJntRawResponse,
    transform: (data, awbNo) =>
      transformJntTrackingResponse(data as JntTrackingResponse, awbNo),
  },
  {
    vendor: "jne",
    vendorName: "JNE Express",
    detect: isJneRawResponse,
    transform: (data, awbNo) =>
      transformJneTrackingResponse(data as JneTrackingResponse, awbNo),
  },
  {
    vendor: "lion",
    vendorName: "Lion Parcel",
    detect: isLionRawResponse,
    transform: (data, awbNo) =>
      transformLionTrackingResponse(data as LionTrackingResponse, awbNo),
  },
  {
    vendor: "idexpress",
    vendorName: "ID Express",
    detect: isIdexpressRawResponse,
    transform: (data, awbNo) =>
      transformIdexpressTrackingResponse(data as IdexpressTrackingResponse, awbNo),
  },
  {
    vendor: "pos_indonesia",
    vendorName: "Pos Indonesia",
    detect: isPosIndonesiaRawResponse,
    transform: (data, awbNo) =>
      transformPosIndonesiaTrackingResponse(data as PosIndonesiaTrackingResponse, awbNo),
  },
  {
    vendor: "anteraja",
    vendorName: "AnterAja",
    detect: isAnterAjaRawResponse,
    transform: (data, awbNo) =>
      transformAnterAjaTrackingResponse(data as AnterAjaTrackingResponse, awbNo),
  },
  {
    vendor: "sap",
    vendorName: "SAP Express",
    detect: isSapRawResponse,
    transform: (data, awbNo) =>
      transformSapTrackingResponse(data as SapTrackingResponse, awbNo),
  },
  // Add more vendors here in the future
  // {
  //   vendor: "jnt",
  //   vendorName: "J&T Express",
  //   detect: isJntRawResponse,
  //   transform: (data, awbNo) => transformJntTrackingResponse(data as JntTrackingResponse, awbNo),
  // },
];

/**
 * Try to transform raw vendor response to standardized format
 * @param response - The raw response from API
 * @param awbNo - AWB number for fallback
 * @returns Standardized response or null if cannot be transformed
 */
export function tryTransformVendorResponse(
  response: unknown,
  awbNo: string
): StandardizedTrackingResponse | null {
  // Check if already standardized
  if (
    response &&
    typeof response === "object" &&
    "success" in response &&
    "tracking_data" in response
  ) {
    return response as StandardizedTrackingResponse;
  }

  // Try to find matching transformer
  for (const transformer of vendorTransformers) {
    if (transformer.detect(response)) {
      try {
        return transformer.transform(response, awbNo);
      } catch (error) {
        console.error(`Error transforming ${transformer.vendor} response:`, error);
        continue;
      }
    }
  }

  // Check nested responses (e.g., response.data)
  if (response && typeof response === "object") {
    const responseData = response as Record<string, unknown>;
    
    if (responseData.data) {
      for (const transformer of vendorTransformers) {
        if (transformer.detect(responseData.data)) {
          try {
            return transformer.transform(responseData.data, awbNo);
          } catch (error) {
            console.error(`Error transforming ${transformer.vendor} response:`, error);
            continue;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Normalize tracking response - handles both standardized and raw vendor responses
 */
export function normalizeTrackingResponse(
  response: unknown,
  awbNo: string
): StandardizedTrackingResponse | null {
  // Try to transform if it's a raw vendor response
  const transformed = tryTransformVendorResponse(response, awbNo);
  if (transformed) {
    return transformed;
  }

  // If already standardized, return as-is
  if (
    response &&
    typeof response === "object" &&
    "success" in response &&
    "tracking_data" in response
  ) {
    return response as StandardizedTrackingResponse;
  }

  return null;
}

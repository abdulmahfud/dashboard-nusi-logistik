import type { StandardizedTrackingResponse } from "@/types/tracking";
import {
  transformJneTrackingResponse,
  isJneRawResponse,
  type JneTrackingResponse,
} from "./jneTrackingTransform";
import {
  transformPosIndonesiaTrackingResponse,
  isPosIndonesiaRawResponse,
  isPosIndonesiaBeTrackingWrapper,
  transformPosIndonesiaBeTrackingWrapper,
  unwrapPosIndonesiaTrackingPayload,
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
  isLionBeTrackingWrapper,
  transformLionBeTrackingWrapper,
  unwrapLionTrackingPayload,
  type LionTrackingResponse,
} from "./lionTrackingTransform";
import {
  transformIdexpressTrackingResponse,
  isIdexpressRawResponse,
  type IdexpressTrackingResponse,
} from "./idexpressTrackingTransform";
import {
  transformPaxelTrackingResponse,
  isPaxelRawResponse,
  type PaxelTrackingApiResponse,
} from "./paxelTrackingTransform";

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
    vendor: "paxel",
    vendorName: "Paxel",
    detect: isPaxelRawResponse,
    transform: (data, awbNo) =>
      transformPaxelTrackingResponse(data as PaxelTrackingApiResponse, awbNo),
  },
  {
    vendor: "pos_indonesia",
    vendorName: "Pos Indonesia",
    detect: isPosIndonesiaRawResponse,
    transform: (data, awbNo) =>
      transformPosIndonesiaTrackingResponse(data as PosIndonesiaTrackingResponse, awbNo),
  },
  {
    vendor: "posindonesia",
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

/** Format UI: `tracking_data.tracking_history` ada dan bukan wrapper `tracking_data.data` (Pos BE). */
function isFullyStandardizedTrackingResponse(
  response: unknown
): response is StandardizedTrackingResponse {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  if (!("success" in r) || !("tracking_data" in r)) return false;
  const td = r.tracking_data;
  if (!td || typeof td !== "object") return false;
  const t = td as Record<string, unknown>;
  if (isPosIndonesiaRawResponse(t.data)) return false;
  if (isLionRawResponse(t.data)) return false;
  return Array.isArray(t.tracking_history);
}

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
  // BE Pos: { success, tracking_data: { status, data: connote }, order_info }
  if (isPosIndonesiaBeTrackingWrapper(response)) {
    try {
      return transformPosIndonesiaBeTrackingWrapper(response, awbNo);
    } catch (error) {
      console.error("Error transforming Pos Indonesia BE tracking wrapper:", error);
    }
  }

  // BE Lion: { success, tracking_data: { status, data: { stts } }, order_info }
  if (isLionBeTrackingWrapper(response)) {
    try {
      return transformLionBeTrackingWrapper(response, awbNo);
    } catch (error) {
      console.error("Error transforming Lion BE tracking wrapper:", error);
    }
  }

  if (isFullyStandardizedTrackingResponse(response)) {
    return response;
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

    const posPayload = unwrapPosIndonesiaTrackingPayload(response);
    if (posPayload) {
      try {
        return transformPosIndonesiaTrackingResponse(posPayload, awbNo);
      } catch (error) {
        console.error("Error transforming pos_indonesia response:", error);
      }
    }

    const lionPayload = unwrapLionTrackingPayload(response);
    if (lionPayload) {
      try {
        return transformLionTrackingResponse(lionPayload, awbNo);
      } catch (error) {
        console.error("Error transforming lion response:", error);
      }
    }

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
  const transformed = tryTransformVendorResponse(response, awbNo);
  if (transformed) {
    return transformed;
  }

  if (isFullyStandardizedTrackingResponse(response)) {
    return response;
  }

  return null;
}

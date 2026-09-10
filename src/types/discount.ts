export interface ExpeditionDiscount {
  id: number;
  vendor: string;
  /** BE selalu paksa null sekarang — "jenis layanan" tidak dibedakan lagi. */
  service_type: string | null;
  description: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  minimum_order_value: number | null;
  maximum_discount_amount: number | null;
  user_type: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number;
  priority: number;
}

export interface DiscountCalculation {
  has_discount: boolean;
  discount_amount: number;
  discounted_price: number;
  original_price: number;
  discount_id: number | null;
  discount_description: string | null;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
}

export interface AvailableDiscountsResponse {
  status: string;
  data: {
    available_discounts: ExpeditionDiscount[];
    best_discount?: DiscountCalculation;
    order_value?: number;
  };
}

export interface ShippingCostWithDiscount {
  vendor: string;
  service_name: string;
  service_code: string;
  original_cost: number;
  discount_info: DiscountCalculation;
  final_cost: number;
  estimated_delivery: string;
}

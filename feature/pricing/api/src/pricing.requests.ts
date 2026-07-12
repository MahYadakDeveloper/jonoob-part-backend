import { CustomerType, LineItems } from "@feature/common";

export type PricingPolicy = "wholesale" | "retail";


export interface LineTotalPricingRequest {
  items: { productId: string; purchaseQty: number }[];
  policy: PricingPolicy;
}

export interface ManyUnitPricingRequest {
  items: Map<string, { qty: number }>;
  policy: PricingPolicy;
}

export interface UnitPricingRequest {
  item: { productId: string }[];
  policy: PricingPolicy;
}

export interface InvoicePricingRequest {
  items: LineItems<{productId: string, qty: number}>;
  policy: PricingPolicy;
}

export interface PricingPolicyReq {
  customerType: CustomerType;
}

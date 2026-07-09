import { CustomerType } from "@feature/common";

export type PricingPolicy = "wholesale" | "retail";

export interface LineTotalPricingRequest {
  items: { productId: string; purchaseQty: number }[];
  policy: PricingPolicy;
}

export interface ManyUnitPricingRequest {
  items: { productId: string; quantity?: number }[];
  customerId?: string;
  policy: PricingPolicy;
}

export interface UnitPricingRequest {
  item: { productId: string; quantity?: number };
  customerId?: string;
  policy: PricingPolicy;
}

export interface SalePricingRequest {
  customerId?: string;
  items: { productId: string; quantity: number }[];
  policy: PricingPolicy;
}

export interface PricingPolicyReq {
  customerType: CustomerType;
}

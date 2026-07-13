import { CustomerType, LineItems } from "@feature/common";
import { UnpricedInvoiceItem } from "./types";

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
  items: LineItems<UnpricedInvoiceItem>;
  policy: PricingPolicy;
}

export interface PricingPolicyReq {
  customerType: CustomerType;
}

import { Invoice, Money } from "@feature/common";
import { PricingPolicy } from "./pricing.req";

export interface LineTotalPricingResponse {
  lineTotal: Money;
  discount: Money;
}

export interface ManyUnitPricingResponse {
  prices: Record<string, Money>;
}

export interface UnitPricingResponse {
  price: Money;
}

export interface InvoicePricingResponse {
  invoice: Pick<Invoice, "items" | "summary">;
}

export interface PricingPolicyRes {
  policy: PricingPolicy;
}

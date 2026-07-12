import {
    InvoiceItem,
    InvoiceSummary,
    LineItems,
    Money
} from "@feature/common";
import { PricingPolicy } from "./pricing.requests";

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
  pricedInvoice: {
    items: LineItems<InvoiceItem>;
    summary: InvoiceSummary;
  };
}

export interface PricingPolicyRes {
  policy: PricingPolicy;
}

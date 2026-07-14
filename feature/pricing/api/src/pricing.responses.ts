import { InvoiceItem, InvoiceSummary, LineItems, Money } from "@feature/common";
import { PricingPolicy } from "./types";

export interface ManyUnitPricingResponse {
  prices: LineItems<{
    productId: string;
    price: Money;
    discount?: Money;
  }>;
}

export interface UnitPricingResponse {
  price: Money;
  discount?: Money;
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

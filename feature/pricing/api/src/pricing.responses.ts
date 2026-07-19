import {
  InvoiceItem,
  InvoiceSummary,
  LineItems,
  Money,
  PricingPolicy,
} from "@feature/common";

export interface ManyProductPricingResponse {
  prices: LineItems<{
    productId: string;
    price: Money;
  }>;
}

export interface ProductPricingResponse {
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

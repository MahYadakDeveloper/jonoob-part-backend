import { CustomerType, LineItems } from "@feature/common";
import { PricingPolicy, UnpricedInvoiceItem } from "./types";

type Item = { productId: string };

export interface ManyProductPricingRequest {
  items: LineItems<Item>;
  policy: PricingPolicy;
}

export interface ProductPricingRequest {
  item: Item;
  policy: PricingPolicy;
}

export interface InvoicePricingRequest {
  customerId?: string;
  items: LineItems<UnpricedInvoiceItem>;
  policy: PricingPolicy;
}

export interface PricingPolicyReq {
  customerType: CustomerType;
}

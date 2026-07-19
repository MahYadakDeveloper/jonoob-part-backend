import { CustomerType, LineItems, PricingPolicy } from "@feature/common";
import {  UnpricedInvoiceItem } from "./types";

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
}

export interface PricingPolicyReq {
  customerId: string;
}

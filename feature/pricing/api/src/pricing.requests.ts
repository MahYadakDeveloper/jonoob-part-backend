import { CustomerType, LineItems } from "@feature/common";
import { PricingPolicy, UnpricedInvoiceItem } from "./types";

type Item = { productId: string };

export interface ManyUnitPricingRequest {
  items: LineItems<Item>;
  customerId?: string;
  policy: PricingPolicy;
}

export interface UnitPricingRequest {
  item: Item;
  customerId?: string;
  policy: PricingPolicy;
}

export interface InvoicePricingRequest {
  items: LineItems<UnpricedInvoiceItem>;
  policy: PricingPolicy;
}

export interface PricingPolicyReq {
  customerType: CustomerType;
}

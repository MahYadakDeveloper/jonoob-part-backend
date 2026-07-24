import { LineItems } from "@feature/common";
import { UnpricedInvoiceItem } from "./pricing.types";

export interface ManyProductPricingRequest {
  productIds: string[];
}

export interface ProductPricingRequest {
  productId: string;
}

export interface InvoicePricingRequest {
  customerId?: string;
  items: LineItems<UnpricedInvoiceItem>;
}

export interface PricingPolicyReq {
  customerId: string;
}

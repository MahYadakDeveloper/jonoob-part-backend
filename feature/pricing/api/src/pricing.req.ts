import { CustomerType, Invoice, InvoiceItem } from "@feature/common";

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

export interface InvoicePricingRequest {
  customerId?: string;
  items: Pick<InvoiceItem, "productId" | "unitOfMeasure" | "quantity">[];
  policy: PricingPolicy;
}

export interface PricingPolicyReq {
  customerType: CustomerType
}

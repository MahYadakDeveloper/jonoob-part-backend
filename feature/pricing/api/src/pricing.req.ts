import { CustomerType } from "@feature/common";

export interface LineTotalPricingRequest {
  productId: string;
  purchaseQty: number;
}

export interface ManyUnitPricingRequest {
  items: { productId: string; quantity?: number }[];
  customerType: CustomerType;
}

export interface UnitPricingRequest {
  item: { productId: string; quantity?: number };
  customerType: CustomerType;
}

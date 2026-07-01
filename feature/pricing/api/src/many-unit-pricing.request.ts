import { CustomerType } from "@feature/common";

export interface ManyUnitPricingRequest {
  items: { productId: string; quantity?: number }[];
  customerType: CustomerType | { customerId: string };
}

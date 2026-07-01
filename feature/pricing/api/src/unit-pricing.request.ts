import { CustomerType } from "@feature/common";

export interface UnitPricingRequest {
  productId: string;
  customerType: CustomerType | { customerId: string };
}

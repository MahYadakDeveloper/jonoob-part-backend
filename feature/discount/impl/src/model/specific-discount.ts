import { Money } from "@feature/common";
import { DiscountUsagePolicy } from "./discount-usage-policy";

export type SpecificDiscount= {
  id: string;
  productId: string;
  usagePolicy: DiscountUsagePolicy;

  displayDiscountPerUnit: Money;
  realDiscountPerUnit: Money;
};

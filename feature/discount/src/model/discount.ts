import { DiscountUsagePolicy } from "./discount-usage-policy.interface";
import { Money } from "@feature/common";

export type Discount = {
  usagePolicy: DiscountUsagePolicy;
  discountPerUnit: Money;
}

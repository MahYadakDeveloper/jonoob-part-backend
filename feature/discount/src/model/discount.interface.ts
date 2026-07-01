import { DiscountUsagePolicy } from "./discount-usage-policy.interface";
import { Money } from "@feature/common";

export interface Discount {
  usagePolicy: DiscountUsagePolicy;
  amount: Money;
}

import { DiscountUsagePolicy } from "./discount-policy.type";
import { DiscountValue } from "./discount-value";

export type ProductDiscount = {
  usagePolicy: DiscountUsagePolicy;
  value: DiscountValue;
};

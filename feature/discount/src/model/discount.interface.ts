import { DiscountValue } from "../types/discount-value.type";
import { DiscountUsagePolicy } from "./discount-usage-policy.interface";

export interface Discount  {
  usagePolicy: DiscountUsagePolicy;
  value: DiscountValue;
};


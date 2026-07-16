import { Money } from "@feature/common";
import { DiscountUsagePolicy } from "./discount-usage-policy";

export type DiscountSpecific =
  | {
      id: string;
      productId: string;
      kind: "unlimited";
      displayDiscountPerUnit: Money;
      realDiscountPerUnit: Money;
    }
  | {
      id: string;
      productId: string;
      kind: "limited";
      displayDiscountPerUnit: Money;
      realDiscountPerUnit: Money;
      usagePolicy: DiscountUsagePolicy;
    };

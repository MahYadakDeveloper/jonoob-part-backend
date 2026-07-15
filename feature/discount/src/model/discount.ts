import { Money } from "@feature/common";

export interface DiscountUsagePolicy {
  maxTotalUses: number;
  maxUsesPerCustomer: number;
  expiresAt?: Date;
}

export type Discount =
  | {
      id: string;
      productId: string;
      kind: "unlimited";
      discountPerUnit: Money;
    }
  | {
      id: string;
      productId: string;
      kind: "limited";
      discountPerUnit: Money;
      usagePolicy: DiscountUsagePolicy;
    };

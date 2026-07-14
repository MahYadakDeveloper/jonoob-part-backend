import { Money } from "@feature/common";

export interface DiscountUsagePolicy {
  maxTotalUses: number;
  maxUsesPerCustomer: number;
  expiresAt?: Date;
}

// TODO: Read the note in below
// Note: DiscountUsage does not require a separate identifier.
// The combination of discountId and customerId uniquely identifies a usage record.
// Enforce this composite uniqueness constraint at the persistence layer.
export interface DiscountUsage {
  discountId: string;
  customerId: string;
  usedQuantity: number;
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

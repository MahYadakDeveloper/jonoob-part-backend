import { Money } from "@feature/common";

export type DiscountUsagePolicy =
  | {
      kind: "limited";
      maxTotalUses: number;
      maxUsesPerCustomer: number;
      expiresAt?: Date;
    }
  | {
      kind: "unlimited";
    };

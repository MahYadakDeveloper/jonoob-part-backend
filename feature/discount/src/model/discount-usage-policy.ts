import { Money } from "@feature/common";

export interface DiscountUsagePolicy {
  maxTotalUses: number;
  maxUsesPerCustomer: number;
  expiresAt?: Date;
}


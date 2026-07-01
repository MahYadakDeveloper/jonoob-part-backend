import { Money } from "@feature/common";

export interface FindApplicableDiscountResponse {
  discountUsagePolicy: {
    maxPerCustomerUsage: number
  },
  discountAmount: Money
}

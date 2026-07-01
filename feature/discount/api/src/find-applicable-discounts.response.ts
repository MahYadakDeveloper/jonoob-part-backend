import { Money } from "@feature/common";

export interface FindApplicableDiscountsResponse {
  discounts: Record<
    string,
    {
      discountUsagePolicy: {
        maxPerCustomerUsage: number;
      };
      discountAmount: Money;
    }[]
  >;
}

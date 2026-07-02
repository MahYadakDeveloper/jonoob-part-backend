import { Money } from "@feature/common";

export interface FindApplicableDiscountResponse {
  discountUsagePolicy: {
    maxPerCustomerUsage: number;
  };
  discountAmount: Money;
}

export interface FindManyApplicableDiscountResponse {
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

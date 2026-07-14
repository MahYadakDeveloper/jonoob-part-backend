import { LineItems, Money } from "@feature/common";

export interface FindApplicableDiscountResponse {
  // discountUsagePolicy: {
  //   maxPerCustomerUsage: number;
  // };
  // discountAmount: Money;
  discount?: Money;
}

export interface FindManyApplicableDiscountResponse {
  // discounts: Record<
  //   string,
  //   {
  //     discountUsagePolicy: {
  //       maxPerCustomerUsage: number;
  //     };
  //     discountAmount: Money;
  //   }[]
  // >;

  discounts: LineItems<{ productId: string; discount?: Money }>;
}

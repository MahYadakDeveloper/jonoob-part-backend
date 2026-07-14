import { LineItems, Money } from "@feature/common";

type ApplicableDiscount = {
  discountPerUnit: Money;
  applicableQuantity: number;
  totalDiscount: Money;
};

export interface FindApplicableDiscountResponse {
  applicableDiscount: ApplicableDiscount;
}

export interface FindManyApplicableDiscountResponse {
  discounts: LineItems<{
    productId: string;
    applicableDiscount: ApplicableDiscount;
  }>;
}

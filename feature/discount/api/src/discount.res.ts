import { LineItems } from "@feature/common";
import { ApplicableDiscount } from "./discount.types";

export interface FindApplicableDiscountResponse {
  discount?: ApplicableDiscount;
}

export interface FindManyApplicableDiscountResponse {
  discounts: LineItems<{
    productId: string;
    discount: ApplicableDiscount;
  }>;
}

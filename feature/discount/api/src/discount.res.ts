import { LineItems, Money } from "@feature/common";
import { SpecificDiscount, CampaignDiscount } from "./discount.types";

export interface FindApplicableDiscountResponse {
  discount?: CampaignDiscount | SpecificDiscount;
}

export interface FindManyApplicableDiscountResponse {
  discounts: LineItems<{
    productId: string;
    discount: CampaignDiscount | SpecificDiscount;
  }>;
}

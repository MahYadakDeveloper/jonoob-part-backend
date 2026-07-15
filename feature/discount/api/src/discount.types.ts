import { Money } from "@feature/common";

export type SpecificDiscount = {
  kind: "specific";
  discountPerUnit: Money;
  applicableQuantity: number | "unlimited";
};

export type CampaignDiscount = {
  kind: "campaign";
  discountRate: number;
};

export type ProductDiscount = CampaignDiscount | SpecificDiscount;

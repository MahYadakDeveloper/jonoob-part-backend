import { Money } from "@feature/common";

export type SpecificDiscount = {
  id: string;
  kind: "specific";
  displayDiscountPerUnit: Money;
  realDiscountPreUnit: Money;
  applicableQuantity: number | "unlimited";
};

export type CampaignDiscount = {
  id: string;
  kind: "campaign";
  displayDiscountRate: number;
  realDiscountRate: number;
  applicableQuantity: number | "unlimited";
};

export type ProductDiscount = CampaignDiscount | SpecificDiscount;

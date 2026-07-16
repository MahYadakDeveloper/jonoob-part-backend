import { LineItems } from "@feature/common";
import { DiscountUsagePolicy } from "./discount-usage-policy";

export type DiscountCampaignProduct =
  | {
      id: string;
      kind: "unlimited";
      productId: string;
      displayDiscountRate: number;
      realDiscountRate: number;
    }
  | {
      id: string;
      kind: "limited";
      productId: string;
      displayDiscountRate: number;
      realDiscountRate: number;
      usagePolicy: Omit<DiscountUsagePolicy, "expiresAt">;
    };

export type DiscountCampaign = {
  id: string;
  name: string;

  startedAt: Date;
  expiresAt: Date;

  defaultDisplayDiscountRate: number;
  defaultRealDiscountRate: number;

  // fake & real

  products: LineItems<DiscountCampaignProduct>;
};

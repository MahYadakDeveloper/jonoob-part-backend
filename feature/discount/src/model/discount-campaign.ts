export type DiscountCampaign = {
  id: string;
  name: string;

  startedAt: Date;
  expiresAt: Date;

  defaultDiscountRate: number;

  products: { id: string; discountRate?: number }[];
};

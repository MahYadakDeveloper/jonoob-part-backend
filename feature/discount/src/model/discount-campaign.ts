export type DiscountCampaign = {
  id: string;
  name: string;

  startedAt: Date;
  expiresAt: Date;

  defaultDiscountRate: number;
  // fake & real

  products: {
    id: string;
    // display(fake) & real
    discountRate?: number;
  }[];
};

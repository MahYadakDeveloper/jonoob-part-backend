export const PricesUpdatedEventJobName = 'prices.updated';
export type PricesUpdatedEventJobPayload = {
  tag: 'price';
  productIds: string[];
};

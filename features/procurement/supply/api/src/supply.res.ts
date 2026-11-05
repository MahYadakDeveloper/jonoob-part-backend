import { LineItems, Money } from '@feature/shared';

export interface FindLatestPurchasePriceResponse {
  price: Money;
}
export interface FindManyLatestPurchasePriceResponse {
  prices: LineItems<{ goodId: string; price: Money }>;
}

export interface SupplyReturnResponse {
  returnId: string;
}

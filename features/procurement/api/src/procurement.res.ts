import { LineItems, Money } from '@feature/shared';

export interface ProductPurchasePriceResponse {
  price: Money;
}

export interface ManyProductPurchasePriceResponse {
  prices: LineItems<{ goodId: string; price: Money }>;
}

export interface SupplyReturnResponse {
  returnId: string;
}

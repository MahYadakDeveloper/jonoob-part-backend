import { LineItems, Money } from '@feature/common';

export interface ProductPurchasePriceResponse {
  price: Money;
}

export interface ManyProductPurchasePriceResponse {
  prices: LineItems<{ goodId: string; price: Money }>;
}

export interface SupplyReturnResponse {
  returnId: string;
}

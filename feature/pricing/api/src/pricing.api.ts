import { PriceItemRequest, PriceResult, PricingContext } from './pricing.types';

export interface PricingApi {
  price(ctx: PricingContext, items: PriceItemRequest[]): Promise<PriceResult>;
}

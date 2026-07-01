import { ProductPricingRequest } from "./product-pricing.request";
import { ProductPricingResponse } from "./product-pricing.response";

export interface PricingService {
  priceProduct(req: ProductPricingRequest): ProductPricingResponse;
}

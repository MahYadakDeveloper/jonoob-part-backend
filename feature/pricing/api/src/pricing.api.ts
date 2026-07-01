import { LineTotalPricingRequest } from "./line-total-pricing.request";
import { LineTotalPricingResponse } from "./line-total-pricing.response";
import { UnitPricingRequest } from "./unit-pricing.request";
import { UnitPricingResponse } from "./unit-pricing.response";

export interface PricingService {
  priceUnit(req: UnitPricingRequest): UnitPricingResponse;
  priceLineTotal(req: LineTotalPricingRequest): LineTotalPricingResponse;
  // priceSubtotal(req: SubtotalPricingRequest): SubtotalPricingResponse;
}

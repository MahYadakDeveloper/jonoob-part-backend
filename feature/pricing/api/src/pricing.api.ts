import { LineTotalPricingRequest } from "./line-total-pricing.request";
import { LineTotalPricingResponse } from "./line-total-pricing.response";
import { ManyUnitPricingRequest } from "./many-unit-pricing.request";
import { ManyUnitPricingResponse } from "./many-unit-pricing.response";
import { UnitPricingRequest } from "./unit-pricing.request";
import { UnitPricingResponse } from "./unit-pricing.response";

export interface PricingService {
  priceUnit(req: UnitPricingRequest): Promise<UnitPricingResponse>;
  priceManyUnit(req: ManyUnitPricingRequest): Promise<ManyUnitPricingResponse>;
  priceLineTotal(req: LineTotalPricingRequest): Promise<LineTotalPricingResponse>;
  // priceSubtotal(req: SubtotalPricingRequest): SubtotalPricingResponse;
}

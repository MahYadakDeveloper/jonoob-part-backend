import {
  LineTotalPricingRequest,
  ManyUnitPricingRequest,
  UnitPricingRequest,
} from "./pricing.req";
import {
  LineTotalPricingResponse,
  ManyUnitPricingResponse,
  UnitPricingResponse,
} from "./pricing.res";

export interface IPricingService {
  priceUnit(req: UnitPricingRequest): Promise<UnitPricingResponse>;
  priceManyUnit(req: ManyUnitPricingRequest): Promise<ManyUnitPricingResponse>;
  priceLineTotal(
    req: LineTotalPricingRequest,
  ): Promise<LineTotalPricingResponse>;
  // priceSubtotal(req: SubtotalPricingRequest): SubtotalPricingResponse;
}

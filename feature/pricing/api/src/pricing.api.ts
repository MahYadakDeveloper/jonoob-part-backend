import {
  LineTotalPricingRequest,
  ManyUnitPricingRequest,
  PricingPolicyReq,
  SalePricingRequest,
  UnitPricingRequest,
} from "./pricing.requests";
import {
  LineTotalPricingResponse,
  ManyUnitPricingResponse,
  PricingPolicyRes,
  SalePricingResponse,
  UnitPricingResponse,
} from "./pricing.responses";

export interface IPricingService {
  priceUnit(req: UnitPricingRequest): Promise<UnitPricingResponse>;
  priceManyUnit(req: ManyUnitPricingRequest): Promise<ManyUnitPricingResponse>;
  priceLineTotal(
    req: LineTotalPricingRequest,
  ): Promise<LineTotalPricingResponse>;
  priceSale(req: SalePricingRequest): Promise<SalePricingResponse>;
  getPricingPolicy(req: PricingPolicyReq): PricingPolicyRes;
}

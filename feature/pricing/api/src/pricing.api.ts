import {
  InvoicePricingRequest,
  LineTotalPricingRequest,
  ManyUnitPricingRequest,
  PricingPolicyReq,
  UnitPricingRequest,
} from "./pricing.req";
import {
  InvoicePricingResponse,
  LineTotalPricingResponse,
  ManyUnitPricingResponse,
  PricingPolicyRes,
  UnitPricingResponse,
} from "./pricing.res";

export interface IPricingService {
  priceUnit(req: UnitPricingRequest): Promise<UnitPricingResponse>;
  priceManyUnit(req: ManyUnitPricingRequest): Promise<ManyUnitPricingResponse>;
  priceLineTotal(
    req: LineTotalPricingRequest,
  ): Promise<LineTotalPricingResponse>;
  priceInvoice(req: InvoicePricingRequest): Promise<InvoicePricingResponse>;
  getPricingPolicy(req: PricingPolicyReq): PricingPolicyRes;
}

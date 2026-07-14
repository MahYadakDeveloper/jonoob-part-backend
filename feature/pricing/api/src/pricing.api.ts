import {
  InvoicePricingRequest,
  ManyUnitPricingRequest,
  PricingPolicyReq,
  UnitPricingRequest,
} from "./pricing.requests";
import {
  InvoicePricingResponse,
  ManyUnitPricingResponse,
  PricingPolicyRes,
  UnitPricingResponse,
} from "./pricing.responses";

export interface IPricingService {
  priceUnit(req: UnitPricingRequest): Promise<UnitPricingResponse>;
  priceManyUnit(req: ManyUnitPricingRequest): Promise<ManyUnitPricingResponse>;
  priceInvoice(req: InvoicePricingRequest): Promise<InvoicePricingResponse>;
  getPricingPolicy(req: PricingPolicyReq): PricingPolicyRes;
}

import {
  InvoicePricingRequest,
  LineTotalPricingRequest,
  ManyUnitPricingRequest,
  UnitPricingRequest,
} from "./pricing.req";
import {
  InvoicePricingResponse,
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
  priceInvoice(req: InvoicePricingRequest): Promise<InvoicePricingResponse>;
  // priceSubtotal(req: SubtotalPricingRequest): SubtotalPricingResponse;
}

import {
  InvoicePricingRequest,
  ManyProductPricingRequest,
  PricingPolicyReq,
  ProductPricingRequest,
} from "./pricing.requests";
import {
  InvoicePricingResponse,
  ManyProductPricingResponse,
  PricingPolicyRes,
  ProductPricingResponse,
} from "./pricing.responses";

export interface IPricingService {
  priceProduct(req: ProductPricingRequest): Promise<ProductPricingResponse>;
  priceManyProduct(
    req: ManyProductPricingRequest,
  ): Promise<ManyProductPricingResponse>;
  priceInvoice(req: InvoicePricingRequest): Promise<InvoicePricingResponse>;
  resolvePricingPolicy(req: PricingPolicyReq): Promise<PricingPolicyRes>;
}

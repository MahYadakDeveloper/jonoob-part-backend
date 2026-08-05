import {
  InvoicePricingRequest,
  ManyProductPricingRequest,
  ProductPricingRequest,
} from './pricing.requests';
import {
  InvoicePricingResponse,
  ManyProductPricingResponse,
  ProductPricingResponse,
} from './pricing.responses';

export interface PricingApi {
  priceProduct(req: ProductPricingRequest): Promise<ProductPricingResponse>;
  priceManyProduct(req: ManyProductPricingRequest): Promise<ManyProductPricingResponse>;
  priceInvoice(req: InvoicePricingRequest): Promise<InvoicePricingResponse>;
}

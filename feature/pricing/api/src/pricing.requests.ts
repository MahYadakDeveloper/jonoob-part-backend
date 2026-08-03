import { LineItems } from '@feature/common';
import { UnpricedInvoiceItem } from './pricing.types';

export interface ManyProductPricingRequest {
  productIds: string[];

  policy: 'wholesale' | 'retail';
}

export interface ProductPricingRequest {
  productId: string;

  policy: 'wholesale' | 'retail';
}

export interface InvoicePricingRequest {
  customerId?: string;
  items: LineItems<UnpricedInvoiceItem>;
}

export interface PricingPolicyReq {
  customerId: string;
}

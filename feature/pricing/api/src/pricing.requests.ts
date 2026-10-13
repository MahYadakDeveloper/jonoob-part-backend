import { CustomerType, LineItems } from '@feature/shared';
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
  customer?: {
    id: string;
    type: CustomerType;
  };
  items: LineItems<UnpricedInvoiceItem>;
}

import { InvoiceItem, InvoiceSummary, LineItems, Money } from '@feature/shared';

export interface ManyProductPricingResponse {
  prices: LineItems<{
    productId: string;
    price: Money;
  }>;
}

export interface ProductPricingResponse {
  price: Money;
}

export interface InvoicePricingResponse {
  pricedInvoice: {
    items: LineItems<InvoiceItem>;
    summary: InvoiceSummary;
  };
}

import { LineItems } from '@feature/common';

export interface ProductPurchasePriceRequest {
  goodId: string;
}

export interface ManyProductPurchasePriceRequest {
  goodIds: string[];
}

export interface SupplyReturnRequest {
  specialistId: string;
  supplierId: string;
  items: LineItems<{ goodId: string; quantity: number }>;
}

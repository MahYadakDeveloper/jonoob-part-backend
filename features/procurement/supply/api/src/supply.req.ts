import { LineItems } from '@feature/shared';

export interface FindLatestPurchasePriceRequest {
  goodId: string;
}

export interface FindManyLatestPurchasePriceRequest {
  goodIds: string[];
}

export interface SupplyReturnRequest {
  specialistId: string;
  supplierId: string;
  items: LineItems<{ goodId: string; quantity: number }>;
}

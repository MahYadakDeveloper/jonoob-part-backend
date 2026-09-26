export interface ProductPurchasePriceRequest {
  goodId: string;
}

export interface ManyProductPurchasePriceRequest {
  goodIds: string[];
}

export interface SupplyReturnRequest {
  specialistId: string;
  supplierId: string;
  items: { stockId: string; qty: number }[];
}

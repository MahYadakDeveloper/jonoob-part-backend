import { Barcode } from '@feature/common';
import { StockDetails } from '@feature/warehouse-api';

export interface StockAdjustmentRequest {
  qty: number;
}

export interface AvailableStocksRequest {
  goodIds: string[];
}
export interface AvailableStockRequest {
  goodId: string;
}

export interface FindStockByBarcodeRequest {
  barcode: Barcode;
}

export interface GoodUpdateRequest {
  goodId: string;
  details: Omit<StockDetails, 'goodId'>;
}

import { Barcode, LineItems } from '@feature/common';

type ItemType = {
  goodId: string;
  quantity: number;
};

type Reference = {
  source: string;
  id: string;
};

export interface GoodIdResolvingRequest {
  barcode: Barcode;
}

export interface StockExistenceRequest {
  goodIds: string[];
}

export interface GoodsIssuingRequest {
  reference: Reference;
  items: LineItems<ItemType>;
}

export interface StockReservingRequest {
  referenceId: string;
  items: LineItems<ItemType>;
}

export interface StockReleasingRequest {
  referenceId: string;
  items: LineItems<ItemType>;
}

export interface ReceiveReturnedRequest {
  returnId: string;
  items: LineItems<ItemType>;
}

export interface GetStockRequest {
  goodId: string;
}

export interface GetStocksRequest {
  goodIds: string[];
  onNotFound?: 'ignore' | 'throw';
}

export interface GetGoodDetailsRequest {
  goodId: string;
}

export interface GetWarehouseViewRequest {
  goodId: string;
}

export interface GetWarehouseViewsRequest {
  goodIds: string[];
}

export interface GoodsReceptionRequest {
  reference: Reference;
  items: LineItems<ItemType>;
}

export interface StocksIncreaseRequest {
  items: LineItems<ItemType>;
}

export interface StocksDecreaseRequest {
  items: LineItems<ItemType>;
}

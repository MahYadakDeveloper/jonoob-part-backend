import { Barcode, LineItems } from '@feature/common';

type ItemType = {
  goodId: string;
  quantity: number;
};

export interface GoodIdResolvingRequest {
  barcode: Barcode;
}

export interface StockExistenceRequest {
  goodIds: string[];
}

export interface GoodsIssuingRequest {
  items: LineItems<ItemType>;
}

export interface StockReservingRequest {
  items: LineItems<ItemType>;
}

export interface StockReleasingRequest {
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
  items: LineItems<ItemType>;
}

export interface StocksIncreaseRequest {
  items: LineItems<ItemType>;
}

export interface StocksDecreaseRequest {
  items: LineItems<ItemType>;
}

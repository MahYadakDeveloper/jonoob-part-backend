import { Barcode, LineItems } from '@feature/common';

export interface GoodIdResolvingRequest {
  barcode: Barcode;
}

export interface StockExistenceRequest {
  goodIds: string[];
}

export interface GoodsIssuingRequest {
  items: LineItems<
    | {
        barcode: Barcode;
        quantity: number;
      }
    | {
        goodId: string;
        quantity: number;
      }
  >;
}

export interface StockReservingRequest {
  items: LineItems<{
    goodId: string;
    quantity: number;
  }>;
}

export interface StockReleasingRequest {
  items: LineItems<{
    goodId: string;
    quantity: number;
  }>;
}

export interface ReceiveReturnedRequest {
  returnId: string;
  items: LineItems<{
    goodId: string;
    quantity: number;
  }>;
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

export interface GetManyStockDetailsByBarcodeRequest {
  barcodes: Barcode[];
}

export interface GetWarehouseViewRequest {
  goodId: string;
}

export interface GetWarehouseViewsRequest {
  goodIds: string[];
}

export interface GoodsReceptionRequest {
  goods: LineItems<
    | {
        barcode: Barcode;
        quantity: number;
      }
    | {
        goodId: string;
        quantity: number;
      }
  >;
}

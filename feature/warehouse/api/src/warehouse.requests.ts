export interface GoodsIssuingRequest {
  items: {
    goodsId: string;
    quantity: number;
  }[];
}

export interface StockReservingRequest {
  items: {
    goodsId: string;
    quantity: number;
  }[];
}

export interface StockReleasingRequest {
  items: {
    goodsId: string;
    quantity: number;
  }[];
}


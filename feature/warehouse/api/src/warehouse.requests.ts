export interface GoodsIssuingRequest {
  items: {
    goodId: string;
    quantity: number;
  }[];
}

export interface StockReservingRequest {
  items: {
    goodId: string;
    quantity: number;
  }[];
}

export interface StockReleasingRequest {
  items: {
    goodId: string;
    quantity: number;
  }[];
}

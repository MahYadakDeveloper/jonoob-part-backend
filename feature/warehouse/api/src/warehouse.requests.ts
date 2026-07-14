import { LineItems } from "@feature/common";

export interface GoodsIssuingRequest {
  items: LineItems<{ goodId: string; quantity: number }>;
}

export interface GoodsReceptionRequest {
  items: LineItems<{
    goodId: string;
    quantity: number;
  }>;
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

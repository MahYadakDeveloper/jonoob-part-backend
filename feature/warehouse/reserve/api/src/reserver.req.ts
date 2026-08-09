import { LineItems } from '@feature/common';

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

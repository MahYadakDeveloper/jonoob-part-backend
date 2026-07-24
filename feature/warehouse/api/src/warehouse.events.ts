import { LineItems } from "@feature/common";

export const GoodsIssuedEventType = "warehouse.goods-issued";
export const GoodsReceiptedEventType = "warehouse.goods-receipted";
export const GoodsQuarantinedEventType = "warehouse.goods-quarantined";

export interface GoodsIssuedEventPayload {
  goodIds: string[];
}

export interface GoodsReceiptedEventPayload {
  goodIds: string[];
}

export interface GoodsQuarantinedEventPayload {
  referenceId: string;
  reason: "customer_return" | "supplier_return" | "manual_hold";
  items: LineItems<{ goodId: string; quantity: number }>;
}

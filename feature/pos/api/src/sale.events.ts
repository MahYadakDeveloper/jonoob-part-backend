import { InvoiceSnapshot } from "@feature/common";
import { ReturnSnapshot } from "./sale.types";

export const SaleRecordedEventType = "sale.sale-recorded";
export const SaleReturnRecordedEventType = "sale.sale-recorded";

export interface SaleRecordedEventPayload {
  snapshot: InvoiceSnapshot;
}

export type SaleReturnRecordedEventPayload = { snapshot: ReturnSnapshot };

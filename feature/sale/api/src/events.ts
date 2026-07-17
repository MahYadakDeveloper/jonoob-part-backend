import { InvoiceSnapshot } from "@feature/common";

export const SaleRecordedEventType = "sale.sale-recorded";
export const SaleReturnRecordedEventType = "sale.sale-recorded";

export interface SaleRecordedEventPayload {
  snapshot: InvoiceSnapshot;
}

export type SaleReturnRecordedEventPayload = { TODO: string };

import { InvoiceSnapshot } from "@feature/common";

export class SaleRecordedEvent {
  constructor(
    readonly snapshot: InvoiceSnapshot,
    readonly customerId?: string,
  ) {}
}

export class SaleReturnRecordedEvent {
  constructor(readonly saleReturnId: string) {}
}

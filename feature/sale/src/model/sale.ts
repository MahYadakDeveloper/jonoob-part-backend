import {
  InvoiceHeader,
  InvoiceItem,
  InvoicePayment,
  InvoiceSnapshot,
  InvoiceSummary,
  LineItems,
} from "@feature/common";
import { InvoiceNumber } from "./invoice-number";

export type SaleStatus = "draft" | "completed" | "cancelled" | "refunded";

export class Sale {
  private constructor(
    readonly id: string,
    readonly invoiceNumber: InvoiceNumber,
    private _header: InvoiceHeader,
    private _items: LineItems<InvoiceItem>,
    private _summary: InvoiceSummary,
    private _payment: InvoicePayment,

    readonly status: SaleStatus,
  ) {}

  static create(
    id: string,
    invoiceNumber: InvoiceNumber,
    snapshot: InvoiceSnapshot,
  ): Sale {
    return new Sale(
      id,
      invoiceNumber,
      snapshot.header,
      snapshot.items,
      snapshot.summary,
      snapshot.payment,
      "completed",
    );
  }

  get snapshot(): InvoiceSnapshot {
    return {
      header: this._header,
      items: this._items,
      summary: this._summary,
      payment: this._payment,
    };
  }
}

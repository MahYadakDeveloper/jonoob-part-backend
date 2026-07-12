import {
  InvoiceHeader,
  InvoiceItem,
  InvoicePayment,
  InvoiceSnapshot,
  InvoiceSummary,
} from "@feature/common";

export type SaleStatus = "draft" | "completed" | "cancelled" | "refunded";

export class Sale {
  private constructor(
    readonly id: string,

    private _header: InvoiceHeader,
    private _items: readonly InvoiceItem[],
    private _summary: InvoiceSummary,
    private _payment: InvoicePayment,

    readonly status: SaleStatus,
  ) {}

  static create(id: string, snapshot: Required<InvoiceSnapshot>): Sale {
    return new Sale(
      id,
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

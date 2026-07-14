import {
  InvoiceHeader,
  InvoiceItemBase,
  LineItems,
  Money,
} from "@feature/common";
import { InvoiceNumber } from "./invoice-number";

export class SaleReturn {
  private constructor(
    readonly id: string,
    readonly saleId: string,
    readonly returnNumber: InvoiceNumber,

    private _header: InvoiceHeader,
    private _items: LineItems<InvoiceItemBase>,
    private _summary: ReturnSummary,
    private _refund: ReturnRefund,
  ) {}

  static create(
    id: string,
    saleId: string,
    returnNumber: InvoiceNumber,
    snapshot: ReturnSnapshot,
  ): SaleReturn {
    return new SaleReturn(
      id,
      saleId,
      returnNumber,
      snapshot.header,
      snapshot.items,
      snapshot.summary,
      snapshot.refund,
    );
  }

  get snapshot(): ReturnSnapshot {
    return {
      header: this._header,
      items: this._items,
      summary: this._summary,
      refund: this._refund,
    };
  }
}

export type ReturnSnapshot = {
  header: InvoiceHeader;
  items: LineItems<InvoiceItemBase>;
  summary: ReturnSummary;
  refund: ReturnRefund;
};

export type ReturnSummary = {
  readonly refund: Money;
  readonly payableRefund: Money;
};

export type ReturnRefund = {
  readonly amount: Money;
  readonly cashbackReversed: Money;
};

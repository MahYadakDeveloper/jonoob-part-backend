import {
  GrantedCashback,
  InvoiceItem,
  LineItems,
  Money,
} from "@feature/common";
import { CashbackReversalPolicy } from "./cashback.enums";

export interface ReversalCashbackRequest {
  customerId: string;
  refundedItems: LineItems<InvoiceItem>;
  referenceId: string;
  granted: GrantedCashback;
  policy: CashbackReversalPolicy;
}

export interface GrantingCashbackRequest {
  customerId: string;
  referenceId: string;
  purchasedItems: LineItems<InvoiceItem>;
  expectedCashback: GrantedCashback;
}

export interface CalculateCashbackRequest {
  customerId: string;
  purchasedItems: LineItems<InvoiceItem>;
}

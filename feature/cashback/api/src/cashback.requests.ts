import {
  CustomerType,
  GrantedCashback,
  InvoiceItem,
  InvoiceItemBase,
  LineItems,
} from '@feature/common';
import { CashbackReversalPolicy } from './cashback.enums';

export interface ReversalCashbackRequest {
  customer: {
    id: string;
    type: CustomerType;
  };
  refundedItems: LineItems<InvoiceItemBase>;
  referenceId: string;
  granted: GrantedCashback;
  policy: CashbackReversalPolicy;
}

export interface GrantingCashbackRequest {
  customer: {
    id: string;
    type: CustomerType;
  };
  referenceId: string;
  purchasedItems: LineItems<InvoiceItem>;
  expectedCashback: GrantedCashback;
}

export interface CalculateCashbackRequest {
  customer: {
    id: string;
    type: CustomerType;
  };
  purchasedItems: LineItems<InvoiceItem>;
}

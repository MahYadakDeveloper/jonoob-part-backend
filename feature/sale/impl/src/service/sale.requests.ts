import { CashbackReversalPolicy } from "@feature/cashback-api";
import { BankDestination, Money } from "@feature/common";

export interface RecordSaleRequest {
  cashierId: string;
  customerId?: string;
  useWallet?: { mode: "full" } | { mode: "partial"; amount: Money };
  manualDiscount?: Money;
  items: {
    productId: string;
    qty: number;
  }[];
}

export type RecordReturnRequest =
  | {
      saleId: string;
      items: {
        productId: string;
        quantity: number;
      }[];
      cashbackReversalPolicy: CashbackReversalPolicy;
      payoff?: { depositTo: BankDestination };
    }
  | {
      saleId: string;
      items: {
        productId: string;
        quantity: number;
      }[];
      cashbackReversalPolicy?: never;
      payoff?: { depositTo: BankDestination };
    };

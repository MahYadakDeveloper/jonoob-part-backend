import { Money } from "@feature/common";
import { CashbackReversalPolicy } from "@feature/cashback-api";

export interface RecordSaleRequest {
  cashierId: string;
  customerId?: string;
  useWallet: false | { wallet: true | Money; verifyCode: string };
  manualDiscount?: Money;
  items: {
    productId: string;
    qty: number;
  }[];
}

export interface RecordReturnRequest {
  saleId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  cashbackReversalPolicy?: CashbackReversalPolicy;
}

import { Money } from "@feature/common";

export interface RecordSaleRequest {
  cashierId: string;
  customerId?: string;
  useWallet: false | { wallet: true | Money; verifyCode: string };

  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface RecordReturnRequest {
  saleId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  discardCashbackReversal?: true | false;
}

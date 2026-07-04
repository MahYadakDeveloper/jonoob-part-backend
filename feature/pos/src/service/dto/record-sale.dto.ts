import { Money } from "@feature/common";

export interface RecordSaleInput {
  cashierId: string;
  customerId?: string;
  useWallet: false | { wallet: true | Money; verifyCode: string };

  items: {
    productId: string;
    quantity: number;
  }[];
}

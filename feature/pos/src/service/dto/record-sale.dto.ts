import { Money } from "@feature/common";

export interface RecordSaleInput {
  cashierId: string;
  customerId: string;
  wallet: false | true | Money;
  items: {
    productId: string;
    quantity: number;
  }[];
}

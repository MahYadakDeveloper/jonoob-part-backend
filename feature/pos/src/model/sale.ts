import { Money } from "./money";

export class Invoice {
  constructor(
    private readonly header: {
      readonly cashierId: string;
      readonly issuedAt: Date;
      readonly customerId?: string;
    },

    private readonly items: Item[],

    private readonly summary: {
      readonly reward?: Money;
      readonly subtotal: Money;
      readonly grandTotal: Money;
      readonly discount?: Money;
    },

    private readonly payment: {
      readonly paidWithWalletBalance: Money;
      readonly amountDue: Money;
    },
  ) {
    new Money(3).sum()
  }
}

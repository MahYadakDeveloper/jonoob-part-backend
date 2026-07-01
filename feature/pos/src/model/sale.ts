import { UnitOfMeasure, Money } from "@feature/common";
export interface Invoice {
  readonly header: {
    readonly cashierId: string;
    readonly issuedAt: Date;
    readonly customerId?: string;
  };

  readonly items: {
    readonly productId: string;
    readonly quantity: number;
    readonly unitOfMeasure: UnitOfMeasure;
    readonly unitPrice: Money;
    readonly lineTotal: Money;
    readonly discount?: Money;
  }[];

  readonly summary: {
    readonly reward?: Money;
    readonly subtotal: Money;
    readonly grandTotal: Money;
    readonly discount?: Money;
  };

  readonly payment: {
    readonly paidWithWalletBalance: Money;
    readonly amountDue: Money;
  };
}

import { Money, Payment } from "@feature/common";

export type SaleItem = {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
  readonly discount?: Money;
};

export type Sale = {
  readonly header: {
    readonly cashierId: string;
    readonly issuedAt: Date;
    readonly customerId?: string;
  };

  readonly items: SaleItem[];

  readonly summary: {
    readonly cashback?: Money;
    readonly subtotal: Money;
    readonly grandTotal: Money;
    readonly discount?: Money;
  };

  readonly payment: Payment;
};

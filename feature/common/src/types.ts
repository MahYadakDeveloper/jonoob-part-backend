import { Money } from "./model/money";

export type UnitOfMeasure = "piece" | "pair" | "set";

export type CustomerType = "merchant" | "consumer" | "technician";

export type Payment =
  | {
      paidAmountByBalance: Money;
      externalPayment?: {
        paymentMethod: "onlinePaymentGateway" | "posTerminal";
        amount: Money;
      };
    }
  | {
      externalPayment: {
        paymentMethod: "onlinePaymentGateway" | "posTerminal";
        amount: Money;
      };
    };

export type InvoiceItem = {
  readonly productId: string;
  readonly quantity: number;
  readonly unitOfMeasure: UnitOfMeasure;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
  readonly discount?: Money;
};

export type Invoice = {
  readonly header: {
    readonly cashierId: string;
    readonly issuedAt: Date;
    readonly customerId?: string;
  };

  readonly items: InvoiceItem[];

  readonly summary: {
    readonly rewards?: Money;
    readonly subtotal: Money;
    readonly grandTotal: Money;
    readonly discount?: Money;
  };

  readonly payment: Payment;
};

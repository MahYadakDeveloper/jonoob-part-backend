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


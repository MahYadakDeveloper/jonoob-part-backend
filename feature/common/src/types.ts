import { Money } from "./model/money";

export type UnitOfMeasure = "piece" | "pair" | "set";

export type CustomerType = "merchant" | "consumer" | "technician";
export type PricingPolicy = "wholesale" | "retail";

export type BankDestination = {
  cardNumber: string;
  firstName: string;
  lastName: string;
};

export type ProductLeafKind = { kind: "product" };
export type ProductBundleKind = { kind: "bundle" };
export type ProductKind = ProductBundleKind | ProductLeafKind;

export type PaymentMethod = "posTerminal" | "onlinePaymentGateway";

export type Payment =
  | {
      kind: "wallet";
      walletAmount: Money;
    }
  | {
      kind: "external";
      external: {
        method: PaymentMethod;
        amount: Money;
      };
    }
  | {
      kind: "mixed";
      walletAmount: Money;
      external: {
        method: PaymentMethod;
        amount: Money;
      };
    };

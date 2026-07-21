import { Money } from "@feature/common";
import { UseWallet } from "./payment.types";

export type PlanPaymentRequest =
  | {
      customerId: string;
      amountDue: Money;
      useWallet?: UseWallet;
    }
  | {
      amountDue: Money;
    };

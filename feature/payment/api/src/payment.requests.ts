import { Money } from "@feature/common";

export interface PlanPaymentRequest {
  customerId: string;
  amountDue: Money;
  wallet: false | true | Money;

  externalPaymentMethod?: "posTerminal" | "onlinePaymentGateway";
}

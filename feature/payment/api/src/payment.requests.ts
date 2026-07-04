import { Money } from "@feature/common";

export interface PlanPaymentRequest {
  customerId: string;
  amountDue: Money;
  useWallet: false | { wallet: true | Money; verifyCode: string };

  externalPaymentMethod?: "posTerminal" | "onlinePaymentGateway";
}

import { Money, Payment } from "@feature/common";
import { UseWallet } from "./payment.types";

export interface PlanPaymentRequest {
  customerId: string;
  amountDue: Money;
  useWallet: UseWallet;

  payment: Payment;
}

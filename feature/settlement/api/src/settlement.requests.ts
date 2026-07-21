import { BankDestination, Money } from "@feature/common";

export type RefundRequest = {
  customerId?: string;
  amount: Money;
  referenceId: string;
  destination?: BankDestination;
};

import { BankDestination, Money } from "@feature/shared";

export type RefundRequest = {
  customerId?: string;
  amount: Money;
  referenceId: string;
  destination?: BankDestination;
};

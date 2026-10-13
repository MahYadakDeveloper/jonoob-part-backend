import { BankDestination, Money } from "@feature/shared";

export type WithdrawalRequest = {
  customerId: string;
  type: "withdrawal";
  amount: Money;
  referenceId: string;
  destination: BankDestination;
};

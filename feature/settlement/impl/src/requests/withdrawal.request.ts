import { BankDestination, Money } from "@feature/common";

export type WithdrawalRequest = {
  customerId: string;
  type: "withdrawal";
  amount: Money;
  referenceId: string;
  destination: BankDestination;
};

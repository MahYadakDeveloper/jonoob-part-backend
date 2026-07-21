import { Money } from "@feature/common";
import { PaymentDestination, SettlementType } from "type";

export interface WithdrawalRequest {
  customerId: string;
  amount: Money;
  referenceId: string;
  destination: PaymentDestination;
  type: SettlementType;
}

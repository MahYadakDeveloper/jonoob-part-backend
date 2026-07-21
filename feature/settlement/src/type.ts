import { BankDestination, Money } from "@feature/common";

export type SettlementType = "withdrawal" | "refund";

export type SettlementStatus =
  | "pending"
  | "processing"
  | "paid"
  | "rejected"
  | "cancelled";

export type SettlementRequestWithdrawalType = {
  type: "withdrawal";
  customerId: string;
  amount: Money;
  destination: BankDestination;
  referenceId: string;
  freezeId: string;
};

export type SettlementRequestRefundType = {
  type: "refund";
  customerId?: string | null;
  amount: Money;
  destination: BankDestination;
  referenceId: string; // returnId
};
export type SettlementRequest = (
  | SettlementRequestRefundType
  | SettlementRequestWithdrawalType
) & {
  id: string;
  status: SettlementStatus;
  createdAt: Date;
  processedAt?: Date;
  rejectionReason?: string;
  receiptText?: string;
};

export type NewSettlementRequest =
  | SettlementRequestRefundType
  | SettlementRequestWithdrawalType;

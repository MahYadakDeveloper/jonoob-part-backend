import { Money } from "@feature/common";

export type SettlementType = "withdrawal" | "refund";

export type SettlementStatus =
  | "pending"
  | "processing"
  | "paid"
  | "rejected"
  | "cancelled";

export interface PaymentDestination {
  cardNumber: string;
  firstName: string;
  lastName: string;
}
export interface SettlementRequest {
  id: string;
  type: SettlementType;
  customerId: string;
  amount: Money;
  referenceId: string;
  freezeId: string;
  status: SettlementStatus;

  destination: PaymentDestination;

  createdAt: Date;
  processedAt?: Date;

  rejectionReason?: string;
  receiptText?: string;
}

export interface NewSettlementRequest {
  type: SettlementType;
  customerId: string;
  amount: Money;
  referenceId: string;
  freezeId: string;

  destination: PaymentDestination;
}

import { CustomerType, Money } from "@feature/common";

export interface ReversalCashbackRequest {
  customerId: string,
  refund: Money,
}

export interface CalculationCashbackRequest {
  customerType: CustomerType
  total: Money
}

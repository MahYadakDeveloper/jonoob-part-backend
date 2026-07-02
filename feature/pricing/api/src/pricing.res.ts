import { Money } from "@feature/common";

export interface LineTotalPricingResponse {
  lineTotal: Money;
  discount: Money;
}

export interface ManyUnitPricingResponse {
  prices: Record<string, Money>;
}

export interface UnitPricingResponse {
  price: Money;
}

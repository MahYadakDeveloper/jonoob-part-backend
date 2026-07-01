import { Money } from "@feature/common";

export interface LineTotalPricingResponse {
  lineTotal: Money;
  discount: Money;
}

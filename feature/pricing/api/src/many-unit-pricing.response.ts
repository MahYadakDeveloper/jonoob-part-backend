import { Money } from "@feature/common";

export interface ManyUnitPricingResponse {
  prices: Record<string, Money>;
}

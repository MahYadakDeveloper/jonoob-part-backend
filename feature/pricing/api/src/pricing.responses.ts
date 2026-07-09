import { Money } from "@feature/common";
import { PricingPolicy } from "./pricing.requests";

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

export interface SalePricingResponse {
  sale: {
    readonly items: {
      readonly productId: string;
      readonly quantity: number;
      readonly unitPrice: Money;
      readonly lineTotal: Money;
      readonly discount?: Money;
    }[];
    readonly summary: {
      readonly subtotal: Money;
      readonly grandTotal: Money;
      readonly discount?: Money;
    };
  };
}

export interface PricingPolicyRes {
  policy: PricingPolicy;
}

import { Money } from "@feature/common";

export interface IPricingCalculator {
  calculateUnit(purchasePrice: Money, markup: number): Money
}
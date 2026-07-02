import { Money } from "@feature/common";
import { IPricingCalculator } from "./pricing-calculator";

export class RetailPricingCalculator implements IPricingCalculator {
  calculateUnit(purchasePrice: Money, markup: number): Money {
    throw new Error("Method not implemented.");
  }
}

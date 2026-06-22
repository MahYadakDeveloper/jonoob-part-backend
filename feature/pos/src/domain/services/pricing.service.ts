import { Quantity } from "@feature/shared";
import { Markup } from "domain/value-object/markup";
import { Money } from "domain/value-object/money";

// TODO: This may be in shared feature and reused by others
// TODO: consider for technician and merchant pricing
// NOTE: Discounts not applied for technician/merchant
export class PricingService {
  calculateTotalDiscount() {}
  calculateDueAmount() {}
  calculateLineTotal() {}
  calculateTotalAmount() {}
  calculateUnit(purchasedUnit: Money, markup: Markup): Money {
    return purchasedUnit.multiply(1 + markup.value);
  }
}

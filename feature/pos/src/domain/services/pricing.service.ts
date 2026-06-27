import { Quantity } from "@feature/shared";
import { ProductDiscount } from "domain/value-object/discount";
import { Markup } from "domain/value-object/markup";
import { Money } from "domain/value-object/money";

// TODO: This may be in shared feature and reused by others
// TODO: consider for technician and merchant pricing
// NOTE: Discounts not applied for technician/merchant
export abstract class PricingService {
  constructor(private readonly markup: Markup) {}
  abstract calculateGrandTotal(lineTotals: Money[]): Money;
  abstract calculateLineTotal(
    unitPrice: Money,
    qty: Quantity,
    discount?: ProductDiscount,
  ): Money;
  abstract calculateSubtotal(
    lineTotalWithOutDiscounts: { unitPrice: Money; qty: Quantity }[],
  ): Money;
  abstract calculateDiscount(discounts: ProductDiscount[]);
  abstract calculateUnit(purchasePrice: Money): Money;
}

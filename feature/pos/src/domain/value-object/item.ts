import { Packaging, Quantity, UnitOfMeasure } from "@feature/shared";
import { Money } from "./money";
import { ProductId } from "./product-id";

export class Item {
  private constructor(
    private readonly _productId: ProductId,
    private readonly _quantity: Quantity,
    private readonly _unit: Packaging,
    private readonly _price: Money,
    private readonly _lineTotal: Money,
    private readonly _discount?: Money,
  ) {}

  static create({
    productId,
    quantity,
    unit,
    price,
    lineTotal,
    discount,
  }: {
    productId: ProductId;
    quantity: Quantity;
    unit: Packaging;
    price: Money;
    lineTotal: Money;
    discount?: Money;
  }) {
    return new Item(productId, quantity, unit, price, lineTotal, discount);
  }
}

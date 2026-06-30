import { Quantity, UnitOfMeasure } from "@feature/shared";
import { Money } from "./money";
import { ProductId } from "./product-id";
import { ProductDiscount } from "./discount";

export class Item {
  private constructor(
    readonly productId: ProductId,
    readonly quantity: Quantity,
    readonly unitOfMeasure: UnitOfMeasure,
    readonly unitPrice: Money,
    readonly lineTotal: Money,
    readonly discount?: ProductDiscount,
  ) {}

  static create({
    productId,
    quantity,
    unitOfMeasure,
    unitPrice,
    lineTotal,
    discount,
  }: {
    productId: ProductId;
    quantity: Quantity;
    unitOfMeasure: UnitOfMeasure;
    unitPrice: Money;
    lineTotal: Money;
    discount?: ProductDiscount;
  }): Item {
    return new Item(
      productId,
      quantity,
      unitOfMeasure,
      unitPrice,
      lineTotal,
      discount,
    );
  }
}

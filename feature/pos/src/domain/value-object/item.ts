import { Quantity, UnitOfMeasure } from "@feature/shared";
import { Money } from "./money";
import { ProductId } from "./product-id";

export class Item {
  constructor(
    private readonly _productId: ProductId,
    private readonly _quantity: Quantity,
    private readonly _unitOfMeasure: UnitOfMeasure,
    private readonly _price: Money,
    private readonly _lineTotal: Money,
    private readonly _discount?: Money,
  ) {}

  static create(
    productId: ProductId,
    quantity: Quantity,
    unitOfMeasure: UnitOfMeasure,
    price: Money,
    lineTotal: Money,
    discount?: Money,
  ) {
    return new Item(
      productId,
      quantity,
      unitOfMeasure,
      price,
      lineTotal,
      discount,
    );
  }
}

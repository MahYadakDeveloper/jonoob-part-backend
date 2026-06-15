import { Quantity } from "@feature/shared";
import { GoodId } from "../value-object/good-id";

export class Item {
  private constructor(
    readonly id: GoodId,
    public qty: Quantity,
  ) {}

  static create = (id: GoodId, qty: Quantity) => new Item(id, qty);

  decreaseQty(qty: Quantity) {
    this.qty = this.qty.decrease(qty);
  }
}

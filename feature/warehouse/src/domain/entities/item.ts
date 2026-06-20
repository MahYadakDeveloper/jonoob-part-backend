import { Quantity } from "@feature/shared";
import { GoodId } from "../value-object/good-id";

export class Item {
  public get qty() {
    return this._qty;
  }
  private constructor(
    readonly id: GoodId,
    private _qty: Quantity,
  ) {}

  static create = (id: GoodId, qty?: Quantity) =>
    new Item(id, qty || Quantity.create(1));

  decreaseQty(qty: Quantity) {
    this._qty = this._qty.decrease(qty);
  }
}

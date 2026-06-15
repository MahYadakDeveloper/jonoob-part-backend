import { Quantity } from "@feature/shared";
import { InsufficientStockError } from "../errors/InsufficientStockError";
import { InvalidStockAdjustmentException } from "../errors/invalid-stock-adjustment.error";
import { WarehouseStockRecordNotFoundError } from "../errors/WarehouseStockRecordNotFound";
import { GoodId } from "../value-object/good-id";
import { Item } from "./item";

export class Inventory {
  constructor(private goods: Item[]) {}

  ensureSufficientStock(requestedGoods: Item[]) {
    const stock = new Map(this.goods.map((item) => [item.id.getValue(), item]));

    for (const req of requestedGoods) {
      const item = stock.get(req.id.getValue());

      if (!item) throw new WarehouseStockRecordNotFoundError(req.id.getValue());

      if (!item.qty.isGreaterThenOrEqualTo(req.qty))
        throw new InsufficientStockError(req.id.getValue(), req.qty.getValue());
    }
  }

  ensureItemExists(id: GoodId) {
    const item = this.goods.find((good) => good.id.equals(id));
    if (!item) throw new WarehouseStockRecordNotFoundError(id.getValue());
  }

  findById(id: GoodId) {
    return this.goods.find((good) => good.id.equals(id));
  }

  /**
   * Adjusts the stock quantity of an inventory item by its ID.
   *
   * @param id - The unique identifier of the goods to update.
   * @param newQty - The new quantity to set. Must be greater than zero.
   *
   * @throws {InvalidStockAdjustmentException} If `newQty` is zero or negative.
   * @throws {WarehouseStockRecordNotFoundError} If no item with the given `id` exists.
   */
  adjustStock(id: GoodId, newQty: Quantity) {
    const zeroQty = Quantity.create(0);
    if (zeroQty.isGreaterThenOrEqualTo(newQty))
      throw new InvalidStockAdjustmentException(newQty.getValue());

    const item = this.goods.find((good) => good.id.equals(id));
    if (!item) throw new WarehouseStockRecordNotFoundError(id.getValue());
    item.qty = newQty;
  }

  issueGoods(items: Item[]) {
    items.forEach((item) => this.decrease(item.id, item.qty));
  }

  private decrease(id: GoodId, qty: Quantity) {
    const item = this.goods.find((good) => good.id.equals(id));

    if (!item) throw new WarehouseStockRecordNotFoundError(id.getValue());

    item.decreaseQty(qty);

    this.goods = this.goods.filter((item) => item.qty.getValue() !== 0);
  }
}

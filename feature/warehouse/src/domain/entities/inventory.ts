import { Quantity } from "@feature/shared";
import { InsufficientStockError } from "../errors/InsufficientStockError";
import { InvalidStockAdjustmentException } from "../errors/invalid-stock-adjustment.error";
import { WarehouseStockRecordNotFoundError } from "../errors/WarehouseStockRecordNotFound";
import { GoodId } from "../value-object/good-id";
import { Item } from "./item";

export class Inventory {
  private readonly _outOfStockIds = new Array<GoodId>();
  public get outOfStockIds() {
    return [...this._outOfStockIds];
  }

  public get items() {
    return [...this._items];
  }

  constructor(private _items: Item[]) {}

  ensureSufficientStock(requested_items: Item[]) {
    const stock = new Map(
      this._items.map((item) => [item.id.getValue(), item]),
    );

    for (const req of requested_items) {
      const item = stock.get(req.id.getValue());

      if (!item) throw new WarehouseStockRecordNotFoundError(req.id.getValue());

      if (!item.qty.isGreaterThenOrEqualTo(req.qty))
        throw new InsufficientStockError(req.id.getValue(), req.qty.getValue());
    }
  }

  ensureItemExists(id: GoodId) {
    const item = this._items.find((good) => good.id.equals(id));
    if (!item) throw new WarehouseStockRecordNotFoundError(id.getValue());
  }

  findById(id: GoodId) {
    return this._items.find((good) => good.id.equals(id));
  }

  filterById(ids: GoodId[]) {
    return this._items.filter((item) => ids.some((id) => id.equals(item.id)));
  }

  /**
   * Adjusts the stock quantity of an inventory item by its ID.
   *
   * @param id - The unique identifier of the _items to update.
   * @param newQty - The new quantity to set. Must be greater than zero.
   *
   * @throws {InvalidStockAdjustmentException} If `newQty` is zero or negative.
   * @throws {WarehouseStockRecordNotFoundError} If no item with the given `id` exists.
   */
  adjustStock(id: GoodId, newQty: Quantity) {
    const zeroQty = Quantity.create(0);
    if (zeroQty.isGreaterThenOrEqualTo(newQty))
      throw new InvalidStockAdjustmentException(newQty.getValue());

    const item = this._items.find((good) => good.id.equals(id));
    if (!item) throw new WarehouseStockRecordNotFoundError(id.getValue());

    this._items = this._items.filter((_item) => !_item.id.equals(item.id));
    this._items.push(Item.create(id, newQty));
  }

  issueGoods(items: Item[]) {
    items.forEach((item) => this.decreaseStock(item.id, item.qty));
  }

  private decreaseStock(goodId: GoodId, qty: Quantity) {
    const item = this._items.find((good) => good.id.equals(goodId));

    if (!item) throw new WarehouseStockRecordNotFoundError(goodId.getValue());

    item.decreaseQty(qty);

    this._items = this._items.filter((item) => {
      const outOfStock = item.qty.getValue() === 0;
      if (outOfStock) {
        this._outOfStockIds.push(item.id);
        return false;
      }

      return true;
    });
  }
}

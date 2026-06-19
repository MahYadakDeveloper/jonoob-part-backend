import { Inventory } from "../entities/inventory";
import { Item } from "../entities/item";
import { GoodId } from "../value-object/good-id";

export const WAREHOUSE_REPOSITORY = Symbol("IWarehouseRepository");

export interface IWarehouseRepository {
  /**
   * @returns {Promise<Item[]>} Only return goods stock existed in warehouse
   */
  getStocksByGoodId(ids: GoodId[]): Promise<Item[]>;

  /**
   * Add the goods in warehouse without asking to create new or increasing stock
   * to old one, this procedure first check the item if existed then increases the stock
   * if not create new item in warehouse according to its id and add stock according to
   * quantity passed.
   */
  receiptGoods(items: Item[]): Promise<void>;

  /**
   * To issue a set of goods and decrease stock from warehouse and submitting the record issue.
   * if anything cause failure in process the whole process would be canceled
   */
  issueGoods(items: Item[]): Promise<void>;

  /**
   *
   */
  adjustGoodsStock(item: Item): Promise<void>;

  /**
   *
   */
  loadInventory(items: Item[]): Promise<Inventory>;

  /**
   *
   */
  saveInventory(inventory: Inventory): Promise<void>;
}

import {
  DuplicateGoodError,
  InsufficientStockError,
  StockNotFoundError,
  type IWarehouseRepository,
} from "@feature/warehouse";
import { Injectable } from "@nestjs/common";
import { planStockChanges } from "./stock-planner";
import { type StockCache } from "./cache/stock.cache";
import { type StockDatasource } from "./datasource/stock.datasource";

@Injectable()
export class WarehouseRepository implements IWarehouseRepository {
  constructor(
    private readonly datasource: StockDatasource,
    private readonly cache: StockCache,
  ) {}

  /**
   * Issues goods from the warehouse by decreasing their available stock.
   *
   * The operation is atomic: either all requested goods are issued successfully,
   * or no stock changes are applied.
   *
   * @param items List of goods and quantities to issue.
   *
   * @throws {StockNotFoundError}
   * Thrown when a stock record does not exist for one of the requested goods.
   *
   * @throws {InsufficientStockError}
   * Thrown when the available quantity of a stock is less than the requested quantity.
   *
   * @throws {DuplicateGoodError}
   * Thrown when the same good appears more than once in the input collection.
   */
  async issueGoods(
    items: { goodId: string; quantity: number }[],
  ): Promise<void> {
    const goodIds = items.map((item) => item.goodId);

    // Plan and commit changes
    const changes = await this.datasource.transaction(async (tx) => {
      // Ensuring theres no duplications
      items.assertUniqueBy(
        (item) => item.goodId,
        (goodId) => new DuplicateGoodError(goodId),
      );

      const issueQuantities = items.toMap(
        (item) => item.goodId,
        (item) => item.quantity,
      );

      const stocks = (await tx.findManyForUpdate(goodIds)).toMap(
        (stock) => stock.goodId,
        (stock) => stock.quantity,
      );

      // Ensuring all stocks exist and have sufficient quantity available
      const { updates, deletions } = planStockChanges(stocks, issueQuantities);

      // Committing
      if (updates.size > 0) {
        await tx.updateMany(
          Array.from(updates, ([goodId, quantity]) => ({
            goodId,
            quantity,
          })),
        );
      }

      if (deletions.length > 0) {
        await tx.deleteMany(deletions);
      }

      return { updates, deletions };
    });

    // Synchronize cache
    await this.cache.synchronize(changes);
  }

  /**
   * TODO Comment this later
   * @param items
   */
  receiptGoods(items: { goodId: string; quantity: number }[]): Promise<void> {
    
  }

  /**
   *
   * @param items
   */
  async reserveStock(
    items: { goodId: string; quantity: number }[],
  ): Promise<void> {
    // Note: use db to store reserved stocks from stocks in warehouse
  }

  /**
   *
   * @param items
   */
  releaseStock(items: { goodId: string; quantity: number }[]): Promise<void> {
    // Note: use db to store reserved stocks from stocks in warehouse
    throw new Error("Method not implemented.");
  }
  getAvailableStocksByIds(goodIds: string[]): Promise<Record<string, number>> {
    throw new Error("Method not implemented.");
  }
}

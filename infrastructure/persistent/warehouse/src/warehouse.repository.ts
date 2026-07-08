import {
  StockNotFoundError,
  type IWarehouseRepository,
} from "@feature/warehouse";
import { Injectable } from "@nestjs/common";
import { checkSufficientStocks, planStockChanges } from "./stock-planner";
import { type WarehouseCache } from "./warehouse.cache";
import { type WarehouseDatasource } from "./warehouse.datasource";

@Injectable()
export class WarehouseRepository implements IWarehouseRepository {
  constructor(
    private readonly datasource: WarehouseDatasource,
    private readonly cache: WarehouseCache,
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

    const cachedStocks = await this.cache.getMany(goodIds);
    const uncachedStockKeys: string[] = [];
    for (const [key, value] of cachedStocks) {
      if (value === null) {
        uncachedStockKeys.push(key);
      }
    }

    if (uncachedStockKeys.length > 0) {
      let _uncachedStockKeys = uncachedStockKeys;

      // Checking if there's stocks reserved that cause to became to unavailable stock(reaching 0).
      const reservedStocks =
        await this.cache.getReservedMany(uncachedStockKeys);
      for (const [key, value] of reservedStocks) {
        cachedStocks.set(key, value);
        _uncachedStockKeys = _uncachedStockKeys.filter(
          (uncachedKey) => key === uncachedKey,
        );
      }

      // Caching from main db
      const uncachedStocks = (
        await this.datasource.findMany(_uncachedStockKeys)
      ).toMap(
        (x) => x.goodId,
        (x) => x.quantity,
      );
      for (const key of _uncachedStockKeys) {
        const uncachedStock = uncachedStocks.get(key);
        if (!uncachedStock) throw new StockNotFoundError(key);

        cachedStocks.set(key, uncachedStock);
      }

      await this.cache.setMany(uncachedStocks);
    }

    const issueQuantities = items.toMap(
      (item) => item.goodId,
      (item) => item.quantity,
    );

    const changes = await this.datasource.transaction(async (tx) => {
      const stocks = cachedStocks.require();
      const { updates, deletions } = planStockChanges(stocks, issueQuantities);
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

    try {
      await this.cache.applyChanges(changes);
    } catch {
      await this.cache.deleteMany(items.map((item) => item.goodId));
    }
  }

  /**
   * TODO Comment this later
   * @param items 
   */
  receiptGoods(items: { goodId: string; quantity: number }[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async reserveStock(
    items: { goodId: string; quantity: number }[],
  ): Promise<void> {
    const goodIds = items.map((item) => item.goodId);

    const cachedStocks = await this.cache.getMany(goodIds);
    const uncachedStockKeys: string[] = [];
    for (const [key, value] of cachedStocks) {
      if (value === null) {
        uncachedStockKeys.push(key);
      }
    }

    // Caching
    if (uncachedStockKeys.length > 0) {
      // Caching from main db
      const uncachedStocks = (
        await this.datasource.findMany(uncachedStockKeys)
      ).toMap(
        (x) => x.goodId,
        (x) => x.quantity,
      );
      for (const key of uncachedStockKeys) {
        const uncachedStock = uncachedStocks.get(key);
        if (!uncachedStock) throw new StockNotFoundError(key);

        cachedStocks.set(key, uncachedStock);
      }

      await this.cache.setMany(uncachedStocks);
    }

    const stock = cachedStocks.require();

    // Til there we are sure that the stocks available if is not error would been thrown.
    // but one thing we are not sure is that sufficient stocks for reserve are here
    const req = items.toMap(
      (item) => item.goodId,
      (item) => item.quantity,
    );
    checkSufficientStocks(stock, req);

    // We now sure is there sufficient stock, so we reserve then
    await this.cache.reserveMany(req);
  }

  /**
   * 
   * @param items 
   */
  releaseStock(items: { goodId: string; quantity: number }[]): Promise<void> {
    // this would be done only with caching no database
    throw new Error("Method not implemented.");
  }
  getAvailableStocksByIds(goodIds: string[]): Promise<Record<string, number>> {
    throw new Error("Method not implemented.");
  }
}

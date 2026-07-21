import { type DbProvider } from "@feature/common";
import {
    DuplicateGoodError,
    InsufficientStockError,
    StockNotFoundError,
    type WarehouseRepository,
} from "@feature/warehouse";
import { BaseRepository } from "@infra/common-persistent";
import { PrismaDbClient } from "@infra/prisma-db";
import { Injectable } from "@nestjs/common";
import { type StockCache } from "./cache/stock.cache";
import { planStockChanges } from "./stock-planner";

@Injectable()
export class WarehouseRepositoryImpl
  extends BaseRepository<PrismaDbClient>
  implements WarehouseRepository
{
  constructor(
    dbProvider: DbProvider<PrismaDbClient>,
    private readonly cache: StockCache,
  ) {
    super(dbProvider);
  }

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
    // Ensuring theres no duplications
    items.assertUniqueBy(
      (item) => item.goodId,
      (goodId) => new DuplicateGoodError(goodId),
    );

    const issueQuantities = items.toMap(
      (item) => item.goodId,
      (item) => item.quantity,
    );

    // Read for update (atomic)
    // TODO Do research about (query|execute)raw[unsafe]
    const stocks = await this.db.``;
     

    // Ensuring all stocks exist and have sufficient quantity available

    const changes = planStockChanges(stocks, issueQuantities);

    // Committing
    if (changes.updates.size > 0) {
      await this.datasource.updateMany(
        Array.from(changes.updates, ([goodId, quantity]) => ({
          goodId,
          quantity,
        })),
      );
    }

    if (changes.deletions.length > 0) {
      await this.datasource.deleteMany(changes.deletions);
    }

    // Synchronize cache
    await this.cache.synchronize(changes);
  }

  /**
   * TODO Comment this later
   * @param items
   */
  receiptGoods(items: { goodId: string; quantity: number }[]): Promise<void> {}

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

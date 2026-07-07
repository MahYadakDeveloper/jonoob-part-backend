import { type IWarehouseRepository } from "@feature/warehouse";
import { Injectable } from "@nestjs/common";
import { planStockChanges } from "./stock-planner";
import { type WarehouseCache } from "./warehouse.cache";

@Injectable()
export class WarehouseRepository implements IWarehouseRepository {
  constructor(
    private readonly datasource: IWarehouseDatasource,
    private readonly cache: WarehouseCache,
  ) {}

  async issueGoods(
    items: { goodId: string; quantity: number }[],
  ): Promise<void> {
    // IMPORTANT:
    // Compute stock changes only once and apply the same change set to every
    // persistence layer (database, cache, search index, etc.). This prevents
    // inconsistencies caused by duplicated business logic.
    //
    // TODO:
    // Introduce a Synchronizer to guarantee eventual consistency and retry
    // failed updates when a secondary store (e.g. Redis) is temporarily unavailable.
    const goodIds = items.map((item) => item.goodId);

    const stocks = await this.datasource.findStocks(goodIds);

    const issueQuantities = items.toMap(
      (item) => item.goodId,
      (item) => item.quantity,
    );

    const { updates, deletions } = planStockChanges(stocks, issueQuantities);

    // Apply the same computed changes to every persistence layer.
    // This prevents duplicated business logic and inconsistent states.

    // TODO consider exception they may occur like db fail or cache service fails
    if (updates.size > 0) {
      await this.datasource.updateMany(updates);
      await this.cache.setMany(updates);
    }

    if (deletions.length > 0) {
      await this.datasource.deleteMany(deletions);
      await this.cache.deleteMany(deletions);
    }
  }
  receiptGoods(items: { goodId: string; quantity: number }[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  reserveStock(items: { goodId: string; quantity: number }[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  releaseStock(items: { goodId: string; quantity: number }[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getAvailableStocksByIds(goodIds: string[]): Promise<Record<string, number>> {
    throw new Error("Method not implemented.");
  }
}

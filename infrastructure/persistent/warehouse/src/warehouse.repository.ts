import { IWarehouseRepository } from "@feature/warehouse";
import { Injectable } from "@nestjs/common";

@Injectable()
export class WarehouseRepository implements IWarehouseRepository {
  constructor(private readonly datasource: IWarehouseDatasource) {}
  async issueGoods(
    items: { goodId: string; quantity: number }[],
  ): Promise<void> {
    const stocks = await this.getAvailableStocksByIds(
      items.map((item) => item.goodId),
    );

    const updatedStocks: { goodId: string; quantity: number }[] = [];

    for (const item of items) {
      const stock = stocks[item.goodId];

      if (stock === undefined || stock < item.quantity)
        throw new Error("Insufficient stock.");

      if (stock === item.quantity) {
        await this.datasource.delete(item.goodId);
        delete stocks[item.goodId];
      } else {
        const remaining = stock - item.quantity;

        stocks[item.goodId] = remaining;

        updatedStocks.push({
          goodId: item.goodId,
          quantity: remaining,
        });
      }
    }

    if (updatedStocks.length > 0) {
      await this.datasource.updateMany(updatedStocks);
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

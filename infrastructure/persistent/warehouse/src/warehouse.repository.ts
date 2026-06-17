import { Injectable } from "@nestjs/common";
import { PrismaWarehouseRepository } from "./prisma-warehouse.repository";
import { RedisWarehouseRepository } from "./redis-warehouse.repository";
import { GoodId, Item, IWarehouseRepository } from "@feature/warehouse";

@Injectable()
export class WarehouseRepository implements IWarehouseRepository {
  constructor(
    private readonly prismaWarehouseRepository: PrismaWarehouseRepository,
    private readonly redisWarehouseRepository: RedisWarehouseRepository,
  ) {}

  getStocksByGoodId(ids: GoodId[]): Promise<Item[]> {
    throw new Error("Method not implemented.");
  }
  receiptGoods(items: Item[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  issueGoodsAtomically(items: Item[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  adjustGoodsStock(item: Item): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

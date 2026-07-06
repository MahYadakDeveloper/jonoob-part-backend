import { type IWarehouseRepository } from "@feature/warehouse";
import { Injectable } from "@nestjs/common";
import { type RedisClientType } from "redis";
import { type ICache } from "./cache.interface";

@Injectable()
export class CachedWarehouseRepository implements IWarehouseRepository {
  constructor(
    private readonly repository: IWarehouseRepository,
    // private readonly cache: ICache  <- I have doubt about this its to much generalized
  ) {}
    async issueGoods(items: { goodId: string; quantity: number; }[]): Promise<void> {
      // persistence
      await this.repository.issueGoods(items)

      this.cache.invalidate(...)
    }
    receiptGoods(items: { goodId: string; quantity: number; }[]): Promise<void> {
      this.cache.invalidate(...)
        throw new Error('Method not implemented.');
    }
    reserveStock(items: { goodId: string; quantity: number; }[]): Promise<void> {
      
        throw new Error('Method not implemented.');
    }
    releaseStock(items: { goodId: string; quantity: number; }[]): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getAvailableStocksByIds(goodIds: string[]): Promise<Record<string, number>> {
        throw new Error('Method not implemented.');
    }
}
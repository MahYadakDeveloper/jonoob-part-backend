import { Injectable } from "@nestjs/common";
import { PrismaWarehouseRepository } from "./prisma-warehouse/prisma-warehouse.repository";
import { RedisWarehouseRepository } from "./redis-warehouse/redis-warehouse.repository";
import {
  GoodId,
  Inventory,
  Item,
  IWarehouseRepository,
} from "@feature/warehouse";

@Injectable()
export class WarehouseRepository implements IWarehouseRepository {
  constructor(
    private readonly prismaWarehouseRepository: PrismaWarehouseRepository,
    private readonly redisWarehouseRepository: RedisWarehouseRepository,
  ) {}
  findById() {
    // Cache-aside strategy:
    // 1. Read from Redis.
    // 2. On a cache miss, read from the primary database.
    // 3. Cache the result in Redis if it exists.
    // 4. Return undefined if the document is not found.
  }
}

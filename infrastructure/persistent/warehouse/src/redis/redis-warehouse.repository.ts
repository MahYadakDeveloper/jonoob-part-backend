import { GoodId, Item, IWarehouseRepository } from "@feature/warehouse";
import { PrismaService } from "@infra/database";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RedisWarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}
}

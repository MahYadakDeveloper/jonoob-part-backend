import { Injectable } from "@nestjs/common";
import { PrismaService } from "database";
import { IWarehouseRepository } from "warehouse";

@Injectable()
export class PrismaWarehouseRepository implements IWarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async adjustGoodsStock() {}
  async getStocksByGoodId() {}

  /**
   * NOTE: Use redisService [client]
   */
  async issueGoodsAtomically() {
    throw new Error("Not implemented yet!");
  }
  async receiptGoods() {}
}

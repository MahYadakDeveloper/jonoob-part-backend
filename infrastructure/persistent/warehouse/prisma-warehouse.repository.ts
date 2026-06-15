import { Injectable } from "@nestjs/common";
import { PrismaService, Prisma } from "@infra/database";
import { IWarehouseRepository, GoodId, Item } from "@feature/warehouse";
import { Quantity } from "@feature/shared";

@Injectable()
export class PrismaWarehouseRepository implements IWarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async adjustGoodsStock() {}

  async getStocksByGoodId(ids: GoodId[]): Promise<Item[]> {
    const good = await this.prisma.good.findFirst({
      where: {
        id: Number(ids[0].getValue()),
      },
    });

    if (!good) return [];

    return [
      Item.create(
        GoodId.create(good.id.toString()),
        Quantity.create(good.stock),
      ),
    ];
  }
  /**
   * NOTE: Use redisService [client]
   */
  async issueGoodsAtomically() {
    throw new Error("Not implemented yet!");
  }
  async receiptGoods() {

  }
}

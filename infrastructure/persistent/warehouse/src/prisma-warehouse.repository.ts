import { Quantity } from "@feature/shared";
import { GoodId, Item, IWarehouseRepository } from "@feature/warehouse";
import { PrismaService } from "@infra/database";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class PrismaWarehouseRepository implements IWarehouseRepository {
  private readonly logger: Logger;
  constructor(private readonly prisma: PrismaService) {
    this.logger = new Logger(PrismaWarehouseRepository.name);
  }

  async adjustGoodsStock() {}

  async getStocksByGoodId(ids: GoodId[]): Promise<Item[]> {
    const good = await this.prisma.good.findFirst({
      where: {
        id: Number(ids[0].getValue()),
      },
    });

    this.logger.debug("The fetched good from db is", good);

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

  async receiptGoods(items: Item[]) {
    this.logger.debug("receipting good", items);
    await this.prisma.good.create({
      data: {
        goodId: items[0].id.getValue(),
      },
    });
  }
}

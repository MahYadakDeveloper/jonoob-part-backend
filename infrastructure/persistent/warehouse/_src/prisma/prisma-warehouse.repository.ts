import {
  GoodId,
  Inventory,
  Item,
  IWarehouseRepository,
} from "@feature/warehouse";
import { Prisma, PrismaService } from "@infra/database";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class PrismaWarehouseRepository implements IWarehouseRepository {
  private readonly logger: Logger;
  constructor(private readonly prisma: PrismaService) {
    this.logger = new Logger(PrismaWarehouseRepository.name);
  }
  async saveInventory(inventory: Inventory): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.prisma.good.deleteMany({
        where: {
          goodId: {
            in: inventory.outOfStockIds.map((goodId) => goodId.getValue()),
          },
        },
      });

      tx.$transaction(
        inventory.items.map((item) =>
          this.prisma.good.update({
            where: {
              goodId: item.id.getValue(),
            },
            data: {
              stock: item.qty.getValue(),
            },
          }),
        ),
      );
    });
  }

  async loadInventory(items: Item[]): Promise<Inventory> {
    const _items = await this.prisma.good.findMany({
      where: {
        goodId: {
          in: items.map((item) => item.id.getValue()),
        },
      },
    });

    const _inventory = _items.map((item) =>
      Item.create(GoodId.create(item.goodId), Quantity.create(item.stock)),
    );

    return new Inventory(_inventory);
  }

  async adjustGoodsStock() {}

  async getStocksByGoodIds(ids: GoodId[]): Promise<Item[]> {
    const items = await this.prisma.good.findMany({
      where: {
        id: undefined,
        goodId: { in: ids.map((id) => id.getValue()) },
      },
    });

    return items.map((item) =>
      Item.create(GoodId.create(item.goodId), Quantity.create(item.stock)),
    );
  }

  /**
   */
  async issueGoods() {
    throw new Error("Not implemented yet!");
  }

  async receiptGoods(items: Item[]) {
    await this.prisma.good.createMany({
      data: items.map(
        (item) =>
          ({
            goodId: item.id.getValue(),
            stock: item.qty.getValue(),
          }) satisfies Prisma.GoodCreateManyInput,
      ),
    });
  }
}

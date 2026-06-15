import { Module } from "@nestjs/common";
import { WarehouseController } from "./presentation/warehouse.controller";
import { WarehouseService } from "./application/warehouse.service";
import { IWarehouseRepository } from "./domain/repositories/warehouse.repository";
import { Item } from "./domain/entities/item";
import { GoodId } from "./domain/value-object/good-id";


class Mocked implements IWarehouseRepository {
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


@Module({
  providers: [
    WarehouseService,
    {
      provide: "IWarehouseRepository",
      useClass: Mocked,
    },
  ],
  controllers: [WarehouseController],
})
export class WarehouseModule {}

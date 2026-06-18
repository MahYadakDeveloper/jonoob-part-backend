import { Quantity } from "@feature/shared";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Inventory } from "../domain/entities/inventory";
import { Item } from "../domain/entities/item";
import {
  WAREHOUSE_REPOSITORY,
  type IWarehouseRepository,
} from "../domain/repositories/warehouse.repository";
import { GoodId } from "../domain/value-object/good-id";
import { AdjustWarehouseInputDto } from "./dto/adjust-warehouse.dto";
import {
  GetStockAvailabilityInputDto,
  GetStockAvailabilityOutputDto,
} from "./dto/get-stock-availability.dto";
import { RecordGoodsIssueInputDto } from "./dto/record-goods-issue.dto";
import { RecordGoodsReceiptInputDto } from "./dto/record-goods-receipt-dto";

@Injectable()
export class WarehouseService {
  private readonly logger: Logger;
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: IWarehouseRepository,
  ) {
    this.logger = new Logger(WarehouseService.name);
  }

  /**
   * Adjusts the stock quantity of an inventory item by its ID.
   *
   * @param id - The unique identifier of the goods to update.
   * @param newQty - The new quantity to set. Must be greater than zero.
   *
   * @throws {InvalidStockAdjustmentException} If `newQty` is zero or negative.
   * @throws {WarehouseStockRecordNotFoundError} If no item with the given `id` exists.
   */
  async adjustWarehouseStock(inputDto: AdjustWarehouseInputDto) {
    const reqItem = Item.create(
      GoodId.create(inputDto.goodsId),
      Quantity.create(inputDto.stock),
    );

    // fetch the item
    const inventory = new Inventory(
      await this.warehouseRepository.getStocksByGoodId([reqItem.id]),
    );

    // ensure existence
    inventory.ensureItemExists(reqItem.id);

    // update the state
    inventory.adjustStock(reqItem.id, reqItem.qty);

    // save the state
    await this.warehouseRepository.adjustGoodsStock(
      inventory.findById(reqItem.id)!,
    );
  }

  async getGoodStock(
    inputDto: GetStockAvailabilityInputDto,
  ): Promise<GetStockAvailabilityOutputDto> {
    const goodId = GoodId.create(inputDto.goodsId);

    const [item] = await this.warehouseRepository.getStocksByGoodId([goodId]);

    return { quantity: item.qty.getValue() };
  }

  async recordGoodsIssue(inputDto: RecordGoodsIssueInputDto) {
    const requestedGoods = inputDto.items.map((item) =>
      Item.create(GoodId.create(item.goodsId), Quantity.create(item.qty)),
    );

    // load -> check -> change state -> save
    // const inventory = new Inventory(await this.warehouseRepository.loadInventory(requestedGoods.map(req => req.id)))

    // inventory.ensureSufficientStock(requestedGoods)

    // inventory.issueGoods(requestedGoods)

    // this.warehouse.saveInventory(inventory)

    // Atomic process by repo safe and simple for this use case and
    // any error thrown by this method its handled by provider
    this.warehouseRepository.issueGoodsAtomically(requestedGoods);

    // TODO: Replenishment List |‌ Replenishment List Generation Based on Reorder Point

    // TODO: Register the record of this issue
  }

  async recordGoodsReceipt(inputDto: RecordGoodsReceiptInputDto) {
    // dto conversion
    const items = inputDto.items.map((item) =>
      Item.create(GoodId.create(item.goodsId), Quantity.create(item.qty || 1)),
    );

    this.warehouseRepository.receiptGoods(items);
  }
}

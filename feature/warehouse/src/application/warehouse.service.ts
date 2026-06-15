import { Inject, Injectable, Logger } from "@nestjs/common";
import { Inventory } from "../domain/entities/inventory";
import { Item } from "../domain/entities/item";
import { type IWarehouseRepository } from "../domain/repositories/warehouse.repository";
import { GoodId } from "../domain/value-object/good-id";
import { AdjustWarehouseInputDTO } from "./dto/adjust-warehouse.dto";
import { CheckStockAvailabilityInputDTO } from "./dto/check-stock-availability.dto";
import { RecordGoodsIssueInputDTO } from "./dto/record-goods-issue.dto";
import { Quantity } from "shared";

@Injectable()
export class WarehouseService {
  private readonly logger: Logger;
  constructor(
    @Inject("IWarehouseRepository")
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
  async adjustWarehouseStock(inputDto: AdjustWarehouseInputDTO) {
    const reqItem = Item.create(
      GoodId.create(inputDto.goodsId),
      Quantity.create(inputDto.stock),
    );

    this.logger.verbose("logging from adjust warehouse use case...");

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

  async getGoodStock(inputDto: CheckStockAvailabilityInputDTO) {
    const item = Item.create(
      GoodId.create(inputDto.goodsId),
      Quantity.create(inputDto.qty),
    );

    const inventory = new Inventory(
      await this.warehouseRepository.getStocksByGoodId([item.id]),
    );

    this.logger.verbose("this is my inventory", inventory);

    inventory.ensureSufficientStock([item]);

    return inventory.findById(item.id)?.qty;
  }

  async recordGoodsIssue(inputDto: RecordGoodsIssueInputDTO) {
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

  async recordGoodsReceipt(inputDto: RecordGoodsIssueInputDTO) {
    // dto conversion
    const items = inputDto.items.map((item) =>
      Item.create(GoodId.create(item.goodsId), Quantity.create(item.qty)),
    );

    this.warehouseRepository.receiptGoods(items);
  }
}

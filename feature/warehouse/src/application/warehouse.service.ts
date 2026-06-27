import { Quantity } from "@feature/shared";
import { Inject, Injectable, Logger } from "@nestjs/common";
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
import { WarehouseStockRecordNotFoundError } from "../domain/errors/WarehouseStockRecordNotFound";

// TODO: Add UnitOfMeasure and Packaging in warehouse documentation

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
    const input = Item.create(
      GoodId.create(inputDto.goodId),
      Quantity.create(inputDto.stock),
    );

    // fetch the item
    const inventory = await this.warehouseRepository.loadInventory([input]);

    // ensure existence
    inventory.ensureItemExists(input.id);

    // update the state
    inventory.adjustStock(input.id, input.qty);

    // save the state
    await this.warehouseRepository.saveInventory(inventory);
  }

  /**
   *
   * @throws {WarehouseStockRecordNotFoundError} If no item with the given `id` exists.
   */
  async getGoodStock(
    inputDto: GetStockAvailabilityInputDto,
  ): Promise<GetStockAvailabilityOutputDto> {
    const goodId = GoodId.create(inputDto.goodId);

    const [item] = await this.warehouseRepository.getStocksByGoodIds([goodId]);

    if (!item) throw new WarehouseStockRecordNotFoundError(goodId.getValue());

    return { stock: item.qty.getValue() };
  }

  async recordGoodsIssue(inputDto: RecordGoodsIssueInputDto) {
    const input = {
      items: inputDto.items.map((item) =>
        Item.create(GoodId.create(item.goodId), Quantity.create(item.qty)),
      ),
    };

    // load -> check -> change state -> save
    const inventory = await this.warehouseRepository.loadInventory(input.items);

    inventory.ensureSufficientStock(input.items);

    inventory.issueGoods(input.items);

    await this.warehouseRepository.saveInventory(inventory);

    // Atomic process by repo safe and simple for this use case and
    // any error thrown by this method its handled by provider

    // TODO: Replenishment List |‌ Replenishment List Generation Based on Reorder Point

    // TODO: Register the record of this issue with related to type document (sale | return[Provider])
  }

  async recordGoodsReceipt(inputDto: RecordGoodsReceiptInputDto) {
    // dto conversion
    const input = inputDto.items.map((item) =>
      Item.create(GoodId.create(item.goodId), Quantity.create(item.qty || 1)),
    );

    // TODO Record with relation to type document (provide | sale_return)
    await this.warehouseRepository.receiptGoods(input);
  }
}

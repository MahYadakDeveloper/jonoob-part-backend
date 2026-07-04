import {
  IWarehouseService,
  UnitOfMeasuresOfProductsRequest,
  UnitOfMeasuresOfProductsResponse,
} from "@feature/warehouse-api";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { type RedisClientType } from "redis";
import {
  GetStockAvailabilityRequest,
  GetStockAvailabilityResponse,
} from "./dto/get-stock-availability.dto";
import { RecordGoodsIssueRequest } from "./dto/record-goods-issue.dto";
import { RecordGoodsReceiptRequest } from "./dto/record-goods-receipt-dto";
import { type IWarehouseRepository } from "./repository/warehouse.repository";
import { AdjustWarehouseRequest } from "./dto/adjust-warehouse.dto";

@Injectable()
export class WarehouseService implements IWarehouseService {
  private readonly logger: Logger;
  constructor(
    @Inject(WAREHOUSE_DATASOURCE)
    private readonly warehouseRepository: IWarehouseRepository,
  ) {
    this.logger = new Logger(WarehouseService.name);
  }
  recordGoodsIssue(req: IssueGoodsRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }
  reserveStock(req: ReserveStocksRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }
  releaseStock(req: ReleaseStocksRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getUnitOfMeasuresOfProducts(
    req: UnitOfMeasuresOfProductsRequest,
  ): Promise<UnitOfMeasuresOfProductsResponse> {
    throw new Error("Method not implemented.");
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
  // async adjustWarehouseStock(req: AdjustWarehouseRequest) {}
  // or
  // async adjustStock(req: StockAdjustmentRequest) {}

  /**
   *
   * @throws {WarehouseStockRecordNotFoundError} If no item with the given `id` exists.
   */
  async getGoodStock(
    req: GetStockAvailabilityRequest,
  ): Promise<GetStockAvailabilityResponse> {
    const goodId = GoodId.create(req.goodId);

    const [item] = await this.warehouseRepository.getStocksByGoodIds([goodId]);

    if (!item) throw new WarehouseStockRecordNotFoundError(goodId.getValue());

    return { stock: item.qty.getValue() };
  }

  private async checkStockAvailability(goodIds: string[]): Promise<boolean> {
    throw new Error("Method not implemented yet!");
  }

  async recordGoodsReceipt(req: RecordGoodsReceiptRequest) {
    // dto conversion
    const input = inputDto.items.map((item) =>
      Item.create(GoodId.create(item.goodId), Quantity.create(item.qty || 1)),
    );

    // TODO Record with relation to type document (provide | sale_return)
    await this.warehouseRepository.receiptGoods(input);
  }
}

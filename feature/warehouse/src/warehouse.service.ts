import {
  GoodsIssuedEvent,
  GoodsIssuingRequest,
  GoodsReceiptedEvent,
  IWarehouseService,
  StockReleasingRequest,
  StockReservingRequest,
} from "@feature/warehouse-api";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  WAREHOUSE_REPOSITORY,
  type IWarehouseRepository,
} from "./repository/warehouse.repository";
import {
  AvailableStockRequest,
  AvailableStocksRequest,
  FindGoodByBarcodeRequest,
  GoodsReceptionRequest,
  GoodUpdateRequest,
} from "./warehouse.requests";
import {
  AvailableStockResponse,
  AvailableStocksResponse,
  FindGoodByBarcodeResponse,
} from "./warehouse.responses";

// Note: use pipelines? for value validation for input requests

@Injectable()
export class WarehouseService implements IWarehouseService {
  private readonly logger: Logger;
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: IWarehouseRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger = new Logger(WarehouseService.name);
  }

  async recordGoodsIssue(req: GoodsIssuingRequest): Promise<void> {
    await this.warehouseRepository.issueGoods(req.items);

    this.eventEmitter.emit(
      "warehouse.goods-issued",
      new GoodsIssuedEvent(req.items.map((item) => item.goodId)),
    );
  }

  reserveStock(req: StockReservingRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }

  releaseStock(req: StockReleasingRequest): Promise<void> {
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
  getAvailableStocks(
    req: AvailableStocksRequest,
  ): Promise<AvailableStocksResponse> {
    return this.warehouseRepository
      .getAvailableStocksByIds(req.goodIds)
      .then((stocks) => ({ stocks }));
  }

  getAvailableStock(
    req: AvailableStockRequest,
  ): Promise<AvailableStockResponse> {
    return this.warehouseRepository
      .getAvailableStocksByIds([req.goodId])
      .then((stocks) => ({ stock: stocks[req.goodId] }));
  }

  /**
   * Records the receipt of goods into the warehouse and updates stock levels.
   *
   * After the stock has been successfully updated, a `warehouse.goods-receipted`
   * event is published so other modules can react to the completed inventory
   * change.
   *
   * The Procurement module listens for this event to re-evaluate reorder points.
   * An event is used instead of a direct service call to keep Warehouse
   * decoupled from Procurement, since inventory changes may originate from
   * different modules (e.g. purchase receipts, sales returns, inventory
   * adjustments, or other warehouse operations).
   *
   * The `warehouse.goods-receipted` is emitted as an event because stock changes can originate from
   * multiple modules (e.g. POS sales, sales returns, manual warehouse operations).
   * Procurement should react only to the completed stock movement, without
   * depending on which module initiated it.
   *
   * @param req The goods receipt request containing the items to receive.
   */
  async recordGoodsReceipt(req: GoodsReceptionRequest) {
    await this.warehouseRepository.receiptGoods(req.items);

    this.eventEmitter.emit(
      "warehouse.goods-receipted",
      new GoodsReceiptedEvent(req.items.map((item) => item.goodId)),
    );
  }

  async findGoodByBarcode(
    req: FindGoodByBarcodeRequest,
  ): Promise<FindGoodByBarcodeResponse> {
    const good = await this.warehouseRepository.findGoodByBarcode(req.barcode);
    return { good };
  }

  async updateGoodData(req: GoodUpdateRequest) {
    return this.warehouseRepository.updateGoodDetails(req.goodId, req.details);
  }
}

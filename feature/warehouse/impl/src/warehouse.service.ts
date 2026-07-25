import {
  type OutboxRepository,
  type TransactionManager,
} from "@feature/common";
import {
  GoodIdResolvingRequest,
  GoodIdResolvingResponse,
  GoodsIssuedEventPayload,
  GoodsIssuedEventType,
  GoodsIssuingRequest,
  GoodsQuarantinedEventPayload,
  GoodsQuarantinedEventType,
  GoodsReceiptedEventPayload,
  GoodsReceiptedEventType,
  ReceiveReturnedRequest,
  StockReleasingRequest,
  StockReservingRequest,
  WarehouseApi,
} from "@feature/warehouse-api";
import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  WAREHOUSE_REPOSITORY,
  type WarehouseRepository,
} from "./repository/warehouse.repository";
import {
  AvailableStockRequest,
  AvailableStocksRequest,
  FindGoodByBarcodeRequest,
  GoodsReceiptingRequest,
  GoodUpdateRequest,
} from "./warehouse.requests";
import {
  AvailableStockResponse,
  AvailableStocksResponse,
  FindGoodByBarcodeResponse,
} from "./warehouse.responses";

@Injectable()
export class WarehouseService implements WarehouseApi {
  private readonly logger: Logger;
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly tx: TransactionManager,
    private readonly repository: WarehouseRepository,
    private readonly outbox: OutboxRepository,
  ) {
    this.logger = new Logger(WarehouseService.name);
  }

  /**
   *
   */
  async receiveCustomerReturn(req: ReceiveReturnedRequest): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.quarantine(req.items);

      await this.outbox.save({
        type: GoodsQuarantinedEventType,
        payload: {
          referenceId: req.returnId,
          reason: "customer_return",
          items: req.items,
        } satisfies GoodsQuarantinedEventPayload,
      });
    });
  }

  async issueGoods(req: GoodsIssuingRequest): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.issue(req.items);

      this.outbox.save({
        type: GoodsIssuedEventType,
        payload: {
          goodIds: [...req.items.keys()],
        } satisfies GoodsIssuedEventPayload,
      });
    });
  }

  resolveGoodId(req: GoodIdResolvingRequest): Promise<GoodIdResolvingResponse> {
    throw new Error("Method not implemented.");
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
    return this.repository
      .getAvailableStocksByIds(req.goodIds)
      .then((stocks) => ({ stocks }));
  }

  getAvailableStock(
    req: AvailableStockRequest,
  ): Promise<AvailableStockResponse> {
    return this.repository
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
  async receiptGoods(req: GoodsReceiptingRequest) {
    await this.tx.run(async () => {
      await this.repository.receipt(req.items);

      this.outbox.save({
        type: GoodsReceiptedEventType,
        payload: {
          goodIds: [...req.items.keys()],
        } satisfies GoodsReceiptedEventPayload,
      });
    });
  }

  async findGoodByBarcode(
    req: FindGoodByBarcodeRequest,
  ): Promise<FindGoodByBarcodeResponse> {
    const good = await this.repository.findGoodByBarcode(req.barcode);
    return { good };
  }

  async updateGoodData(req: GoodUpdateRequest) {
    return this.repository.updateGoodDetails(req.goodId, req.details);
  }
}

import { type OutboxRepository, type TransactionManager } from '@feature/common';
import {
  GetGoodDetailsRequest,
  GetGoodDetailsResponse,
  GetManyStockDetailsByBarcodeRequest,
  GetManyStockDetailsByBarcodeResponse,
  GetStockRequest,
  GetStockResponse,
  GetStocksRequest,
  GetStocksResponse,
  GetWarehouseViewRequest,
  GetWarehouseViewResponse,
  GetWarehouseViewsRequest,
  GetWarehouseViewsResponse,
  GoodIdResolvingRequest,
  GoodIdResolvingResponse,
  GoodsIssuedEventPayload,
  GoodsIssuedEventType,
  GoodsIssuingRequest,
  GoodsReceiptedEventPayload,
  GoodsReceiptedEventType,
  GoodsReceptionRequest,
  ReceiveReturnedRequest,
  StockExistenceRequest,
  StockExistenceResponse,
  StockReleasingRequest,
  StockReservingRequest,
  StocksDecreaseRequest,
  StocksIncreaseRequest,
  WarehouseApi,
} from '@feature/warehouse-api';
import { type StockQuarantineApi } from '@feature/warehouse-quarantine-api';
import { type StockReserverApi } from '@feature/warehouse-reserve-api';
import { Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_REPOSITORY, type WarehouseRepository } from './repository/warehouse.repository';
import {
  AvailableStockRequest,
  AvailableStocksRequest,
  FindStockByBarcodeRequest,
  GoodUpdateRequest,
} from './warehouse.requests';
import {
  AvailableStockResponse,
  AvailableStocksResponse,
  FindStockByBarcodeResponse,
} from './warehouse.responses';

@Injectable()
export class WarehouseService implements WarehouseApi {
  constructor(
    private readonly stockQuarantine: StockQuarantineApi,
    @Inject(WAREHOUSE_REPOSITORY) private readonly repository: WarehouseRepository,
    private readonly reserver: StockReserverApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {}

  increaseStocks(req: StocksIncreaseRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }
  decreaseStocks(req: StocksDecreaseRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getManyStockDetailsByBarcode(
    req: GetManyStockDetailsByBarcodeRequest,
  ): Promise<GetManyStockDetailsByBarcodeResponse> {
    throw new Error('Method not implemented.');
  }
  checkStockExistence(req: StockExistenceRequest): Promise<StockExistenceResponse> {
    throw new Error('Method not implemented.');
  }
  getGoodStock(req: GetStockRequest): Promise<GetStockResponse> {
    throw new Error('Method not implemented.');
  }
  getGoodStocks(req: GetStocksRequest): Promise<GetStocksResponse> {
    throw new Error('Method not implemented.');
  }
  getGoodDetails(req: GetGoodDetailsRequest): Promise<GetGoodDetailsResponse> {
    throw new Error('Method not implemented.');
  }
  getWarehouseView(req: GetWarehouseViewRequest): Promise<GetWarehouseViewResponse> {
    throw new Error('Method not implemented.');
  }
  getWarehouseViews(req: GetWarehouseViewsRequest): Promise<GetWarehouseViewsResponse> {
    throw new Error('Method not implemented.');
  }

  async receiptGoods(req: GoodsReceptionRequest): Promise<void> {
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

  /**
   *
   */
  async receiveCustomerReturn(req: ReceiveReturnedRequest): Promise<void> {
    await this.stockQuarantine.quarantine({
      items: req.items,
      reason: 'customer_return',
      referenceId: req.returnId,
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
    throw new Error('Method not implemented.');
  }

  reserveStock(req: StockReservingRequest): Promise<void> {
    return this.reserver.reserveStock(req);
  }

  releaseStock(req: StockReleasingRequest): Promise<void> {
    return this.reserver.releaseStock(req);
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
  getAvailableStocks(req: AvailableStocksRequest): Promise<AvailableStocksResponse> {
    return this.repository.getAvailableStocks(req.goodIds).then((stocks) => ({ stocks }));
  }

  getAvailableStock(req: AvailableStockRequest): Promise<AvailableStockResponse> {
    return this.repository
      .getAvailableStocks([req.goodId])
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
  // async receiptGoods(req: GoodsReceiptingRequest) {
  //   // }

  async findStockByBarcode(req: FindStockByBarcodeRequest): Promise<FindStockByBarcodeResponse> {
    const stock = await this.repository.findStockByBarcode(req.barcode);
    return { stock };
  }

  async updateStockDetails(req: GoodUpdateRequest) {
    return this.repository.updateStockDetails(req.goodId, req.details);
  }
}

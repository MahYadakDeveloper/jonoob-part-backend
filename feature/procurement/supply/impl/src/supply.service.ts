import { Barcode, type OutboxRepository, type TransactionManager } from '@feature/common';
import {
  FindLatestPurchasePriceRequest,
  FindLatestPurchasePriceResponse,
  FindManyLatestPurchasePriceRequest,
  FindManyLatestPurchasePriceResponse,
  SupplyApi,
  SupplyRecordedEventType,
  SupplyRecordEventPayload,
  SupplyReturnRequest,
  SupplyReturnResponse,
} from '@feature/procurement-supply-api';
import { type PurchaseRecordApi } from '@feature/procurement-supply-purchase-api';
import { type SupplyReturnApi } from '@feature/procurement-supply-return-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { type SupplyRepository } from './supply.repository';
import { SupplyDocumentPageRequest, SupplyRecordingRequest } from './supply.req';
import { SupplyDocumentPageResponse } from './supply.res';

@Injectable()
export class SupplyService implements SupplyApi {
  constructor(
    private readonly repository: SupplyRepository,
    private readonly purchase: PurchaseRecordApi,
    private readonly warehouse: WarehouseApi,
    private readonly supplyReturn: SupplyReturnApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {}
  async findLatestPurchasePrice({
    goodId,
  }: FindLatestPurchasePriceRequest): Promise<FindLatestPurchasePriceResponse> {
    const { record } = await this.purchase.findLatestRecordByGoodId({ goodId });

    return { price: record.purchasePrice };
  }

  async findManyLatestPurchasePrice({
    goodIds,
  }: FindManyLatestPurchasePriceRequest): Promise<FindManyLatestPurchasePriceResponse> {
    const { records } = await this.purchase.findManyLatestRecordByGoodId({ goodIds });

    return {
      prices: records.transform(
        (r) => ({ goodId: r.goodId, price: r.purchasePrice }),
        (r) => r.goodId,
      ),
    };
  }

  documents({ criteria }: SupplyDocumentPageRequest): Promise<SupplyDocumentPageResponse> {
    return this.repository.documents(criteria).then((page) => ({ page }));
  }

  async recordSupply({ document }: SupplyRecordingRequest): Promise<{ documentId: string }> {
    return this.tx.run(async () => {
      const getBarcodeKey = (barcode: Barcode) => `${barcode.type}_${barcode.value}`;

      await this.warehouse.receiptGoods({
        goods: document.lines.transform(
          (item) => ({
            barcode: item.reference,
            quantity: item.quantity,
          }),
          (item) => getBarcodeKey(item.barcode),
        ),
      });

      const { stocksDetails } = await this.warehouse.getManyStockDetailsByBarcode({
        barcodes: document.lines.toArray().map((item) => item.reference),
      });

      const resolvedLines = document.lines.transform(
        (item) => ({
          ...item,
          reference: stocksDetails.getOrThrow(getBarcodeKey(item.reference)).goodId,
        }),
        (item) => item.reference,
      );

      const documentId = await this.repository.saveDocument({
        ...document,
        lines: resolvedLines,
      });

      const { supplier, specialistId } = document;

      const suppliedRecords = resolvedLines.transform(
        (item) => ({
          documentId,
          ...item,
          goodId: item.reference,
          supplier,
          specialistId,
        }),
        (item) => item.reference,
      );

      await this.purchase.createManySuppliedRecord({
        lines: suppliedRecords,
      });

      await this.outbox.save({
        type: SupplyRecordedEventType,
        payload: {
          documentId,
          ...document,
          lines: suppliedRecords,
        } satisfies SupplyRecordEventPayload,
      });

      return { documentId };
    });
  }

  returnSupply(req: SupplyReturnRequest): Promise<SupplyReturnResponse> {
    return this.supplyReturn.recordSupplyReturn(req);
  }

  editDocument() {}
  deleteDocument() {}
}

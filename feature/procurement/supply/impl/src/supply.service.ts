import { type OutboxRepository, type TransactionManager } from '@feature/common';
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

  /**
   * [NOTE]
   *
   * When recording a supply by scanning a good's barcode in the Business Manager app,
   * the scanned barcode must first be resolved to a `goodId`.
   *
   * The client should call the good-resolution endpoint, which performs an upsert:
   * * If the good already exists, return its existing `goodId`.
   * * If it does not exist, create it and return the new `goodId`.
   *
   * If additional good information is required during creation (e.g. `unitOfMeasure`
   * or `storageLocation`)
   *
   * Once the `goodId` has been resolved, it can be used to record the supply.
   */
  async recordSupply({ document }: SupplyRecordingRequest): Promise<{ documentId: string }> {
    return this.tx.run(async () => {
      await this.warehouse.receiptGoods({
        items: document.lines.transform(
          (item) => ({ goodId: item.goodId, quantity: item.quantity }),
          (s) => s.goodId,
        ),
      });

      const documentId = await this.repository.saveDocument(document);

      const { supplier, specialistId } = document;

      const suppliedRecords = document.lines.transform(
        (item) => ({
          documentId,
          ...item,
          goodId: item.goodId,
          supplier,
          specialistId,
        }),
        (item) => item.goodId,
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

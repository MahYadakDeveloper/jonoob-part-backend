import {
  LineItems,
  Money,
  PageResult,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
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
import { type SupplierManagementApi } from '@feature/procurement-supply-supplier-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { SupplyDocument } from './model/supply-document';
import { type SupplyRepository } from './supply.repository';
import { SupplyDocumentPageRequest, SupplyRecordingRequest } from './supply.req';

@Injectable()
export class SupplyService implements SupplyApi {
  constructor(
    private readonly repository: SupplyRepository,
    private readonly purchase: PurchaseRecordApi,
    private readonly warehouse: WarehouseApi,
    private readonly supplyReturn: SupplyReturnApi,
    private readonly supplier: SupplierManagementApi,
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

  documents({ criteria }: SupplyDocumentPageRequest): Promise<PageResult<SupplyDocument>> {
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
      const { supplier } = await this.supplier.findById({ supplierId: document.supplierId });
      const documentId = await this.repository.createDocument({ ...document, supplier });

      await this.warehouse.receiptGoods({
        reference: {
          source: 'supply',
          id: documentId,
        },
        items: document.lines.transform(
          (item) => ({ goodId: item.goodId, quantity: item.quantity }),
          (s) => s.goodId,
        ),
      });

      const { specialistId } = document;

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

  // [NOTE] To edit/remove the supply documents only 3 days have time to edit/remove
  // otherwise have to manage any changes to purchase records and stock changes manually
  async editDocument({ document }: { document: Omit<SupplyDocument, 'suppliedAt' | 'supplier'> }) {
    const supply = await this.repository.findById(document.id);

    if (!supply) throw new Error(`Supply document not found: ${document.id}`);

    const editDeadline = new Date(supply.suppliedAt);
    editDeadline.setDate(editDeadline.getDate() + 3);

    if (new Date() > editDeadline) {
      throw new Error('Supply document can no longer be edited');
    }

    const updateStock = new LineItems<
      { goodId: string; quantity: number } & { operation: 'incr' | 'decr' }
    >((s) => s.goodId);
    const purchaseTasks = new LineItems<
      | { operation: 'remove'; recordId: string; goodId: string }
      | { operation: 'new'; goodId: string; purchasePrice: Money }
      | { operation: 'edit'; recordId: string; goodId: string; purchasePrice: Money }
    >((s) => s.goodId);

    const newLines = document.lines.indexedBy((i) => i.goodId);
    const { records } = await this.purchase.findManyRecordByDocumentId({
      documentId: supply.id,
    });
    const recordsByGoodId = records.indexedBy((x) => x.goodId);

    for (const item of supply.lines) {
      const newQuantity = newLines.get(item.goodId)?.quantity ?? 0;

      const quantityDelta = newQuantity - item.quantity;

      if (quantityDelta !== 0) {
        updateStock.set({
          goodId: item.goodId,
          quantity: Math.abs(quantityDelta),
          operation: quantityDelta > 0 ? 'incr' : 'decr',
        });
      }
      const record = recordsByGoodId.getOrThrow(item.goodId);
      const newRecord = newLines.get(item.goodId);
      if (!newRecord) {
        purchaseTasks.set({ operation: 'remove', recordId: record.id, goodId: item.goodId });
        continue;
      }

      if (item.purchasePrice.equals(newRecord.purchasePrice)) continue;

      purchaseTasks.set({
        operation: 'edit',
        recordId: record.id,
        goodId: item.goodId,
        purchasePrice: newRecord.purchasePrice,
      });
    }

    // for new item added
    const existingGoodIds = new Set(supply.lines.toArray().map((item) => item.goodId));
    for (const item of newLines.toArray()) {
      if (existingGoodIds.has(item.goodId)) continue;

      updateStock.set({ operation: 'incr', goodId: item.goodId, quantity: item.quantity });
      purchaseTasks.set({
        operation: 'new',
        goodId: item.goodId,
        purchasePrice: item.purchasePrice,
      });
    }

    await this.tx.run(async () => {
      const incrStock = updateStock.toArray().filter((s) => s.operation === 'incr');
      if (incrStock.length)
        await this.warehouse.receiptGoods({
          reference: {
            source: 'supply',
            id: supply.id,
          },
          items: incrStock.toLineItems((s) => s.goodId),
        });

      const decrStock = updateStock.toArray().filter((s) => s.operation === 'decr');
      if (decrStock.length)
        await this.warehouse.issueGoods({
          reference: {
            source: 'supply',
            id: supply.id,
          },
          items: decrStock.toLineItems((s) => s.goodId),
        });

      const removePurchases = purchaseTasks.toArray().filter((t) => t.operation === 'remove');
      if (removePurchases.length)
        await this.purchase.deleteMany({ recordIds: removePurchases.map((r) => r.recordId) });

      const createPurchases = purchaseTasks.toArray().filter((t) => t.operation === 'new');
      if (createPurchases.length)
        await this.purchase.createManySuppliedRecord({
          lines: createPurchases
            .toLineItems((r) => r.goodId)
            .transform(
              (r) => ({
                documentId: supply.id,
                specialistId: supply.specialistId,
                purchasePrice: r.purchasePrice,
                goodId: r.goodId,
                supplier: supply.supplier,
              }),
              (r) => r.goodId,
            ),
        });

      const editPurchases = purchaseTasks
        .toArray()
        .filter((t) => t.operation === 'edit')
        .map((r) => ({ recordId: r.recordId, goodId: r.goodId, purchasePrice: r.purchasePrice }));
      if (editPurchases.length)
        await this.purchase.correctMany({ records: editPurchases.toLineItems((r) => r.goodId) });

      await this.repository.updateDocument(document);
    });
  }

  async deleteDocument({ documentId }: { documentId: string }) {
    const supply = await this.repository.findById(documentId);

    if (!supply) throw new Error(`Supply document not found: ${documentId}`);

    const editDeadline = new Date(supply.suppliedAt);
    editDeadline.setDate(editDeadline.getDate() + 3);

    if (new Date() > editDeadline) {
      throw new Error('Supply document can no longer be edited');
    }

    // [TODO]
    await this.tx.run(async () => {
      const { records } = await this.purchase.findManyRecordByDocumentId({ documentId });
      await this.purchase.deleteMany({ recordIds: [...records.indexedBy((r) => r.id).keys()] });
      await this.warehouse.issueGoods({
        reference: {
          source: 'supply',
          id: documentId,
        },
        items: supply.lines.transform(
          (item) => ({ goodId: item.goodId, quantity: item.quantity }),
          (item) => item.goodId,
        ),
      });

      await this.repository.delete(documentId);
    });
  }

  // [TODO] Make the setting api/port reusable in common feature
  // [TODO] Then complete the supplier submodule and return submodule
  // [TODO] And then replenishment module
  @Cron
  purgeOldDocuments() {}

  returnSupply(req: SupplyReturnRequest): Promise<SupplyReturnResponse> {
    return this.supplyReturn.recordSupplyReturn(req);
  }
}

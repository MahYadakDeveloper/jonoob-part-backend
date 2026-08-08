import {
  FindLatestPurchasePriceRequest,
  FindLatestPurchasePriceResponse,
  FindManyLatestPurchasePriceRequest,
  FindManyLatestPurchasePriceResponse,
  SupplyApi,
} from '@feature/procurement-supply-api';
import { type PurchaseRecordApi } from '@feature/procurement-supply-record-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SupplyService implements SupplyApi {
  constructor(private readonly records: PurchaseRecordApi) {}

  async findLatestPurchasePrice({
    goodId,
  }: FindLatestPurchasePriceRequest): Promise<FindLatestPurchasePriceResponse> {
    const { record } = await this.records.findLatestRecordByGoodId({ goodId });

    return { price: record.purchasePrice };
  }
  async findManyLatestPurchasePrice({
    goodIds,
  }: FindManyLatestPurchasePriceRequest): Promise<FindManyLatestPurchasePriceResponse> {
    const { records } = await this.records.findManyLatestRecordByGoodId({ goodIds });

    return {
      prices: records.transform(
        (r) => ({ goodId: r.goodId, price: r.purchasePrice }),
        (r) => r.goodId,
      ),
    };
  }

  // [TODO] extract the paging pattern from catalog searching sections and put it in commons for reuse
  documents(page: number, skip: number, filter: any, sortBy: 'x' | 'y'): Promise<Page<x>>;

  recordSupply(document) {}
  returnSupply(documentId, items);
  editDocument() {}
  deleteDocument() {}
}

import { LineItems } from '@feature/common';
import { PurchaseRecord } from './model/purchase-record';

type CreatePurchaseRecord = Omit<PurchaseRecord, 'id'>;

export interface PurchaseRecordRepository {
  create(data: CreatePurchaseRecord): Promise<string>;
  createMany(data: LineItems<CreatePurchaseRecord>): Promise<string[]>;

  delete(id: string): Promise<void>;
  deleteOlderThan(date: Date): Promise<void>;
}

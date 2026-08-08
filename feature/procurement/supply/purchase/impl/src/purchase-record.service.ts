import { type OutboxRepository, type TransactionManager } from '@feature/common';
import {
  FindLatestRecordByGoodIdRequest,
  FindLatestRecordByGoodIdResponse,
  FindManyLatestRecordByGoodIdRequest,
  FindManyLatestRecordByGoodIdResponse,
  ManyPurchaseRecordEventPayload,
  ManyPurchaseRecordEventType,
  PurchaseRecordApi,
  SuppliedRecordManyCreationRequest,
  SuppliedRecordManyDeletionByDocumentIdRequest,
} from '@feature/procurement-supply-purchase-api';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Duration, type PurchaseRecordRetentionSettings } from './port/purchase-record-retention';
import { type PurchaseRecordRepository } from './purchase-record.repository';
import { QuotedRecordCreationRequest } from './purchase-record.req';

@Injectable()
export class PurchaseRecordService implements PurchaseRecordApi {
  constructor(
    private readonly repository: PurchaseRecordRepository,
    private readonly retentionSetting: PurchaseRecordRetentionSettings,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {}

  findLatestRecordByGoodId(
    req: FindLatestRecordByGoodIdRequest,
  ): Promise<FindLatestRecordByGoodIdResponse> {
    throw new Error('Method not implemented.');
  }
  findManyLatestRecordByGoodId(
    req: FindManyLatestRecordByGoodIdRequest,
  ): Promise<FindManyLatestRecordByGoodIdResponse> {
    throw new Error('Method not implemented.');
  }

  async createManySuppliedRecord(req: SuppliedRecordManyCreationRequest): Promise<void> {
    await this.tx.run(async () => {
      const ids = await this.repository.createMany(
        req.lines.transform(
          (item) => ({
            specialistId: item.specialistId,
            goodId: item.goodId,
            supplier: item.supplier,
            purchasePrice: item.purchasePrice,
            type: 'supply' as const,
            recordedAt: new Date(),
          }),
          (item) => item.goodId,
        ),
      );

      await this.outbox.save({
        type: ManyPurchaseRecordEventType,
        payload: {
          goodIds: req.lines.toArray().map((item) => item.goodId),
        } satisfies ManyPurchaseRecordEventPayload,
      });
    });
  }

  async createQuotedRecord({ data }: QuotedRecordCreationRequest): Promise<{ id: string }> {
    return await this.tx.run(async () => {
      const id = await this.repository.create({
        ...data,
        type: 'quote' as const,
        recordedAt: new Date(),
      });

      await this.outbox.save({
        type: ManyPurchaseRecordEventType,
        payload: {
          goodIds: [data.goodId],
        } satisfies ManyPurchaseRecordEventPayload,
      });

      return { id };
    });
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.tx.run(async () => {
      const record = await this.repository.findById(id);

      await this.repository.delete(id);

      await this.outbox.save({
        type: ManyPurchaseRecordEventType,
        payload: {
          goodIds: [record.goodId],
        } satisfies ManyPurchaseRecordEventPayload,
      });
    });
  }

  @Cron('0 0 4 * * 5', { timeZone: 'Asia/Tehran' })
  async purgeExpiredRecords() {
    // Retention resolve
    const retentionDuration = await this.retentionSetting.getDuration();

    // Cutoff calculation
    const cutoff = this.subtractDuration(new Date(), retentionDuration);

    // Purge expired
    await this.repository.deleteOlderThan(cutoff);
  }

  private subtractDuration(date: Date, duration: Duration): Date {
    const result = new Date(date);

    switch (duration.unit) {
      case 'month':
        result.setMonth(result.getMonth() - duration.value);
        break;

      case 'year':
        result.setFullYear(result.getFullYear() - duration.value);
        break;
    }

    return result;
  }
}

import {
  type OutboxRepository,
  type SettingsStore,
  type TransactionManager,
  Duration,
  SettingToken,
  subtractDuration,
} from '@feature/common';
import {
  CorrectManyRecordRequest,
  CorrectRecordRequest,
  DeleteManyRecordRequest,
  DeleteRecordRequest,
  FindLatestRecordByGoodIdRequest,
  FindLatestRecordByGoodIdResponse,
  FindManyLatestRecordByGoodIdRequest,
  FindManyLatestRecordByGoodIdResponse,
  FindManyRecordByDocumentIdRequest,
  FindManyRecordByDocumentIdResponse,
  ManyPurchaseRecordEventPayload,
  ManyPurchaseRecordEventType,
  PurchaseRecordApi,
  SuppliedRecordManyCreationRequest,
} from '@feature/procurement-supply-purchase-api';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { type PurchaseRecordRepository } from './purchase-record.repository';
import { QuotedRecordCreationRequest } from './purchase-record.req';

@Injectable()
export class PurchaseRecordService implements PurchaseRecordApi {
  static readonly RETENTION_SETTING: SettingToken<Duration> = {
    key: 'purchase-record-retention',

    defaultValue: {
      value: 1,
      unit: 'year',
    },

    schema: z.object({
      value: z.number().positive(),
      unit: z.enum(['month', 'year', 'week']),
    }),
  };

  constructor(
    private readonly repository: PurchaseRecordRepository,
    private readonly settings: SettingsStore,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {}

  findManyRecordByDocumentId(
    req: FindManyRecordByDocumentIdRequest,
  ): Promise<FindManyRecordByDocumentIdResponse> {
    throw new Error('Method not implemented.');
  }
  correct(req: CorrectRecordRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }
  correctMany(req: CorrectManyRecordRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async delete({ recordId }: DeleteRecordRequest): Promise<void> {
    await this.tx.run(async () => {
      const record = await this.repository.findById(recordId);

      await this.repository.delete(recordId);

      await this.outbox.save({
        type: ManyPurchaseRecordEventType,
        payload: {
          goodIds: [record.goodId],
        } satisfies ManyPurchaseRecordEventPayload,
      });
    });
  }
  deleteMany(req: DeleteManyRecordRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

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

  async purgeExpiredRecords() {
    // Resolve Retention settings
    const retentionDuration = await this.settings.get(PurchaseRecordService.RETENTION_SETTING);

    // Cutoff calculation
    const cutoff = subtractDuration(new Date(), retentionDuration);

    // Purge expired
    await this.repository.deleteOlderThan(cutoff);
  }

  async getSettings() {
    const retentionSetting = await this.settings.get(PurchaseRecordService.RETENTION_SETTING);

    return {
      settings: {
        retention: retentionSetting,
      },
    };
  }

  async setSetting({ retention }: { retention?: { duration: Duration } }) {
    if (retention)
      await this.settings.set(PurchaseRecordService.RETENTION_SETTING, retention.duration);
  }
}

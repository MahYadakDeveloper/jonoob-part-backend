import {
  FindLatestRecordByGoodIdRequest,
  FindLatestRecordByGoodIdResponse,
  FindManyLatestRecordByGoodIdRequest,
  FindManyLatestRecordByGoodIdResponse,
  PurchaseRecordApi,
} from '@feature/procurement-supply-record-api';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Duration, type PurchaseRecordRetentionSettings } from './port/purchase-record-retention';
import { type PurchaseRecordRepository } from './purchase-record.repository';
import { QuotedRecordCreationRequest, SuppliedRecordCreationRequest } from './purchase-record.req';

@Injectable()
export class PurchaseRecordService implements PurchaseRecordApi {
  constructor(
    private readonly repository: PurchaseRecordRepository,
    private readonly retentionSetting: PurchaseRecordRetentionSettings,
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

  async createQuotedRecord({ data }: QuotedRecordCreationRequest): Promise<{ id: string }> {
    // [TODO] Dispatch event
    const id = await this.repository.create({
      ...data,
      type: 'quote' as const,
      recordedAt: new Date(),
    });

    return { id };
  }

  async delete({ id }: { id: string }): Promise<void> {
    // [TODO] Dispatch event
    await this.repository.delete(id);
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

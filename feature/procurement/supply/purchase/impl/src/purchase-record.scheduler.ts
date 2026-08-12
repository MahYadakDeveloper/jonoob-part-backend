import { Cron } from '@nestjs/schedule';
import { PurchaseRecordService } from './purchase-record.service';

export class PurchaseRecordScheduler {
  constructor(private readonly purchaseRecordService: PurchaseRecordService) {}

  @Cron('0 0 4 * * 5', { timeZone: 'Asia/Tehran' })
  async executePurge() {
    await this.purchaseRecordService.purgeExpiredRecords();
  }
}

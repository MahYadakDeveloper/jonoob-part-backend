import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupplyService } from './supply.service';

@Injectable()
export class SupplyScheduler {
  constructor(private readonly supplyService: SupplyService) {}

  @Cron('0 0 4 * * 5', { timeZone: 'Asia/Tehran' })
  async executePurge(): Promise<void> {
    await this.supplyService.purge();
  }
}

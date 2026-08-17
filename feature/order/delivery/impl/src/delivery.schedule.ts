import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class DeliverySchedule {
  constructor() {}
  @Cron('0 0 24 * * *', { timeZone: 'Asia/Tehran' })
  purgeDeliveryDayHistory() {}
}

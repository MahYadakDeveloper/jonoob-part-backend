import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaAzkivamTicketRepository } from './azkivam-ticket.repository';

@Injectable()
export class AzkivamGatewaySchedule {
  constructor(private readonly tickets: PrismaAzkivamTicketRepository) {}

  @Cron('0 0 5 * * 5', { timeZone: 'Asia/Tehran' })
  async purgeOldTickets() {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 1);

    await this.tickets.deleteOlderThan(cutoff);
  }
}

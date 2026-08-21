import { Prisma, PrismaService } from '@infra/db-prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaAzkivamTicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(ticketId: string) {
    return this.prisma.azkivamTicket.findUnique({ where: { ticketId } });
  }

  async findByProviderId(providerId: number) {
    return this.prisma.azkivamTicket.findUnique({ where: { providerId } });
  }

  async create(data: Prisma.AzkivamTicketCreateInput) {
    await this.prisma.azkivamTicket.create({ data });
  }

  async delete(ticketId: string) {
    await this.prisma.azkivamTicket.delete({ where: { ticketId } });
  }

  async deleteOlderThan(cutoff: Date) {
    await this.prisma.azkivamTicket.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });
  }
}

import { Prisma, PrismaService } from '@infra/db-prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaAzkivamTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async set(data: Prisma.AzkivamTokenCreateInput) {
    await this.prisma.azkivamToken.upsert({
      where: { key: 'default' },
      create: data,
      update: data,
    });
  }

  async get(): Promise<Prisma.AzkivamTokenGetPayload<{}> | null> {
    return await this.prisma.azkivamToken.findUnique({
      where: {
        key: 'default',
      },
    });
  }
}

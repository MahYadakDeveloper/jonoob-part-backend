import { type DbProvider, SettingsStore, SettingToken } from '@feature/common';
import { BaseRepository } from '@infra/common-persistent';
import { Prisma, PrismaDbClient } from '@infra/db-prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsStoreImpl extends BaseRepository<PrismaDbClient> implements SettingsStore {
  constructor(dbProvider: DbProvider<PrismaDbClient>) {
    super(dbProvider);
  }

  async get<T>(token: SettingToken<T>): Promise<T> {
    const setting = await this.db.setting.findUnique({
      where: {
        key: token.key,
      },
    });

    if (!setting) {
      return token.defaultValue;
    }

    return token.schema.parse(setting.value);
  }

  async set<T>(token: SettingToken<T>, value: T): Promise<void> {
    // Validate before persisting
    const validated = token.schema.parse(value);

    await this.db.setting.upsert({
      where: {
        key: token.key,
      },
      create: {
        key: token.key,
        value: validated as Prisma.InputJsonValue,
      },
      update: {
        value: validated as Prisma.InputJsonValue,
      },
    });
  }
}

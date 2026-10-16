import { settings } from '@infra/db-drizzle/schema';
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { SettingToken } from './setting-token';

@Injectable()
export class DrizzleSettingsStore {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  async get<T>(token: SettingToken<T>): Promise<T> {
    const [row] = await this.db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, token.key))
      .limit(1);

    if (!row) return token.defaultValue;

    return token.schema.parse(row.value);
  }

  async set<T>(token: SettingToken<T>, value: T): Promise<void> {
    // Validate before persisting
    const validated = token.schema.parse(value);

    await this.db
      .insert(settings)
      .values({ key: token.key, value: validated })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: validated, updatedAt: sql`now()` },
      });
  }
}

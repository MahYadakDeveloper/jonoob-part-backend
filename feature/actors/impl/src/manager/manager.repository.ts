import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { managers } from '@infra/db-drizzle/schema';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { eq } from 'drizzle-orm';

export type Manager = typeof managers.$inferSelect;

@Injectable()
export class ManagerRepository extends DrizzleBaseRepository {
  constructor(
    dbProvider: DrizzleDbProvider,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  findById(id: string): Promise<Manager | null> {
    return this.db
      .select()
      .from(managers)
      .where(eq(managers.id, id))
      .then((rows) => rows[0] ?? null);
  }

  findByPhone(phone: string): Promise<Manager | null> {
    return this.db
      .select()
      .from(managers)
      .where(eq(managers.phone, phone))
      .then((rows) => rows[0] ?? null);
  }

  async create(manager: typeof managers.$inferInsert) {
    await this.db.insert(managers).values(manager);
  }
}

import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { actorsRelations, managers } from '@infra/db-drizzle/schema';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { eq } from 'drizzle-orm';

@Injectable()
export class ManagerRepository extends DrizzleBaseRepository<
  typeof actorsRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof actorsRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  findById(id: string) {
    return this.db.query.managers.findFirst({
      where: { id },
    });
  }

  findByPhone(phone: string) {
    return this.db.query.managers.findFirst({
      where: { phone },
    });
  }

  create(manager: typeof managers.$inferInsert) {
    return this.db.insert(managers).values(manager);
  }

  delete(id: string) {
    return this.db.delete(managers).where(eq(managers.id, id));
  }
}

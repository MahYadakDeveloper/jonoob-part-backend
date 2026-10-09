import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import {
  actorsRelations,
  addresses,
  customers,
} from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { DBQueryConfigWith } from 'drizzle-orm';

export type Customer = typeof customers.$inferSelect & {
  addresses: Omit<typeof addresses.$inferSelect, 'customerId'>[];
};

const withAddresses = {
  addresses: {
    columns: {
      customerId: false,
    },
  },
} satisfies DBQueryConfigWith<
  typeof actorsRelations,
  typeof actorsRelations.customers.relations
>;

export class CustomerRepository extends DrizzleBaseRepository<
  typeof actorsRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof actorsRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  findById(id: string): Promise<Customer | null> {
    return this.db.query.customers
      .findFirst({
        where: {
          id,
        },
        with: {
          ...withAddresses,
        },
      })
      .then((customer) => customer ?? null);
  }

  findByPhone(phone: string): Promise<Customer | null> {
    return this.db.query.customers
      .findFirst({
        where: {
          phone,
        },
        with: {
          ...withAddresses,
        },
      })
      .then((customer) => customer ?? null);
  }

  create(
    data: PartialBy<Customer, 'id' | 'wallet' | 'addresses'>,
  ): Promise<{ id: string }> {}
}

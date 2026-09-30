import { Database, DbTransaction } from '../drizzle';
import { DrizzleDbProvider } from '../drizzle-db-provider';

export abstract class DrizzleBaseRepository {
  constructor(protected readonly dbProvider: DrizzleDbProvider) {}

  protected get db(): Database | DbTransaction {
    return this.dbProvider.current;
  }
}

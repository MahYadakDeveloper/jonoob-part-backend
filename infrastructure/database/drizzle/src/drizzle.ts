import { TablesRelationalConfig } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type Database<T extends TablesRelationalConfig> = NodePgDatabase<T>;
/** The `tx` that `db.transaction()` passes its callback. */
export type DbTransaction<T extends TablesRelationalConfig> = Parameters<
  Parameters<Database<T>['transaction']>[0]
>[0];

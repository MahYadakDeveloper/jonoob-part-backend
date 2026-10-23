import { TablesRelationalConfig } from 'drizzle-orm';
import {
  BunSQLDatabase,
  BunSQLTransaction,
} from 'drizzle-orm/bun-sql/postgres';

export type Database<T extends TablesRelationalConfig> = BunSQLDatabase<T>;

export type DbTransaction<T extends TablesRelationalConfig> =
  BunSQLTransaction<T>;

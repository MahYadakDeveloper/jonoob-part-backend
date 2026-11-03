import { sql } from 'drizzle-orm';
import { AnyPgColumn, check } from 'drizzle-orm/pg-core';

export const slugChecks = (tableName: string, col: AnyPgColumn) => [
  check(`${tableName}_slug_format`, sql`${col} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check(`${tableName}_slug_length`, sql`char_length(${col}) between 1 and 100`),
];

import { sql } from 'drizzle-orm';
import { AnyPgColumn, check, pgSchema } from 'drizzle-orm/pg-core';

export const catalogSchema = pgSchema('catalog');

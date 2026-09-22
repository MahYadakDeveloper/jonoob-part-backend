import { pgTable, serial } from 'drizzle-orm/pg-core';

export const stockTable = pgTable('stock', {
  id: serial(),
});

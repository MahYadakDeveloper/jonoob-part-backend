import { addresses } from '@infra/db-drizzle/schema';

export type CustomerAddress = typeof addresses.$inferSelect;

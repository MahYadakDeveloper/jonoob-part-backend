import { customerType } from '@infra/db-drizzle/schema';

export type CustomerType = (typeof customerType.enumValues)[number];

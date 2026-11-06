import { unitOfMeasure } from '@infra/db-drizzle/schema';

export type UnitOfMeasure = (typeof unitOfMeasure.enumValues)[number];

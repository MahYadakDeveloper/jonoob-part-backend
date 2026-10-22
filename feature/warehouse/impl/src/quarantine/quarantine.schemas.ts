import { createPageQuerySchema } from '@feature/shared/utils/pagination';
import { z } from 'zod';
import { quarantineSortableFields } from './quarantine.repository';

export const quarantinesPageQuerySchema = createPageQuerySchema(
  quarantineSortableFields,
  ['-createdAt', 'id'],
);

export type QuarantinesPageQuery = z.infer<typeof quarantinesPageQuerySchema>;

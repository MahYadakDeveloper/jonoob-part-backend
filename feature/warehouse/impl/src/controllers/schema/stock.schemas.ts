import { StockService } from '@/services/stock.service';
import { barcodeType, unitOfMeasure } from '@infra/db-drizzle/schema';
import { z } from 'zod';

const sortableFields = ['definedAt'] as const;
type SortField = (typeof sortableFields)[number];

const sortTerm = z.string().transform((term, ctx) => {
  const direction = term.startsWith('-') ? ('desc' as const) : ('asc' as const);
  const field = term.replace(/^-/, '');

  if (!(sortableFields as readonly string[]).includes(field)) {
    ctx.addIssue({ code: 'custom', message: `Cannot sort by "${field}"` });
    return z.NEVER;
  }
  return { field: field as SortField, direction };
});

export const stockPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .string()
    .default('-createdAt')
    .transform((value) => value.split(',').filter(Boolean))
    .pipe(z.array(sortTerm).min(1).max(3)),
});

export type StockPageQuery = z.infer<typeof stockPageQuerySchema>;
// sort: { field: 'createdAt' | 'quantity'; direction: 'asc' | 'desc' }[]

// =============================================================================

type DefineStockInput = Parameters<StockService['define']>[0];

export const stockDefinitionSchema = z.object({
  barcode: z.object({
    type: z.enum(barcodeType.enumValues),
    value: z.string().min(1),
  }),
  unitOfMeasure: z.enum(unitOfMeasure.enumValues),
  storageLocation: z.string().nullable(),
}) satisfies z.ZodType<DefineStockInput>;

export type StockDefinition = z.infer<typeof stockDefinitionSchema>;

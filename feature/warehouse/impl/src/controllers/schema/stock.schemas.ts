import { stockSortableFields } from '@/services/repositories/stock.repository';
import { StockService } from '@/services/stock.service';
import { barcodeType, unitOfMeasure } from '@infra/db-drizzle/schema';
import { z } from 'zod';
import { createPageQuerySchema } from './utils';

export const stockPageQuerySchema = createPageQuerySchema(
  stockSortableFields,
  '-definedAt',
);
export type StockPageQuery = z.infer<typeof stockPageQuerySchema>;

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

// =============================================================================

export const stockAdjustmentSchema = z.object({
  direction: z.union([z.literal('inbound'), z.literal('outbound')]),
  idempotencyKey: z.uuid(),
  quantity: z.coerce.number().int(),
  source: z.object({
    type: z.literal('adjustment'),
    reason: z.string().optional(),
  }),
});

export type StockAdjustment = z.infer<typeof stockAdjustmentSchema>;

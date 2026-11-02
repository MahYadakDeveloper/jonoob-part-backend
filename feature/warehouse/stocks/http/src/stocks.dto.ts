import {
  isValidBarcode,
  normalizeBarcode,
} from '@infra/schema/warehouse/barcode-rules';
import { barcodes, stocks } from '@infra/schema/warehouse/stocks.schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import { z } from 'zod';

export const barcodeSchema = createSelectSchema(barcodes, {
  value: (s) => s.trim().min(1).max(64),
})
  .pick({ type: true, value: true })
  .transform((b) => ({
    type: b.type,
    value: normalizeBarcode(b.type, b.value),
  }))
  .refine((b) => isValidBarcode(b.type, b.value), {
    path: ['value'],
    message: 'Invalid value for this barcode type',
  });

export const barcodeQuerySchema = barcodeSchema;

export const declarationSchema = createInsertSchema(stocks, {
  // Overrides with a plain zod schema; mirrors the "not blank" DB check.
  storageLocation: z.string().trim().min(1).nullish(),
  quantity: z.int().min(1),
})
  .omit({ id: true, declaredAt: true }) // server-generated
  .extend({
    barcodes: z
      .array(barcodeSchema)
      .min(1)
      .max(20)
      // (type, value) is the PK of barcodes: reject duplicates inside one request.
      .refine(
        (list) =>
          new Set(list.map((b) => `${b.type}:${b.value}`)).size === list.length,
        'Duplicate barcodes',
      ),
  });

export type BarcodeQuery = z.output<typeof barcodeQuerySchema>; // { type; value }
export type Declaration = z.output<typeof declarationSchema>;

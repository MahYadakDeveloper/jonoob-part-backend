/**
 * Sample DTO for procurement. Reference only, do not uncomment as is; adapt it to the
 * real schema.
 *
 * @example
 * ```ts
 * import { discriminatedVariants } from '@feature/shared/zod/utils';
 * import {
 *   procurementEffect,
 *   procurementReason,
 *   procurement,
 * } from '@infra/schema/procurement.schema';
 * import { createInsertSchema } from 'drizzle-orm/zod';
 * import { z } from 'zod';
 *
 * const effect = z.enum(procurementEffect.enumValues);
 * const reason = z.enum(procurementReason.enumValues);
 * const note = z.string().min(1).nullish();
 *
 * const base = createInsertSchema(procurement).omit({
 *   id: true,
 *   createdAt: true,
 *
 *   managerId: true,
 *
 *   effect: true,
 *   reason: true,
 *   note: true,
 * });
 *
 * const { variant, build } = discriminatedVariants(base, 'reason', reason, {
 *   note,
 * });
 *
 * const shortage = { effect: z.literal('shortage') };
 * const surplus = { effect: z.literal('surplus') };
 *
 * export const procurementDtoSchema = build([
 *   variant('lost', shortage),
 *   variant('found', surplus),
 *   variant('other', { effect, note: z.string().min(1) }),
 * ]);
 *
 * export type ProcurementDto = z.infer<typeof procurementDtoSchema>;
 * ```
 */

export {};

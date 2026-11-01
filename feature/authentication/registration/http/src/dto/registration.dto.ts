/**
 * Sample DTO for registration. Reference only, do not uncomment as is; adapt it to the
 * real schema.
 *
 * @example
 * ```ts
 * import { discriminatedVariants } from '@feature/shared/utils/zod';
 * import {
 *   registrationEffect,
 *   registrationReason,
 *   registration,
 * } from '@infra/schema/authentication/registration.schema';
 * import { createInsertSchema } from 'drizzle-orm/zod';
 * import { z } from 'zod';
 *
 * const effect = z.enum(registrationEffect.enumValues);
 * const reason = z.enum(registrationReason.enumValues);
 * const note = z.string().min(1).nullish();
 *
 * const base = createInsertSchema(registration).omit({
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
 * export const registrationDtoSchema = build([
 *   variant('lost', shortage),
 *   variant('found', surplus),
 *   variant('other', { effect, note: z.string().min(1) }),
 * ]);
 *
 * export type RegistrationDto = z.infer<typeof registrationDtoSchema>;
 * ```
 */

export {};

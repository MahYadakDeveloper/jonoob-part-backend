import { z } from 'zod';

export const sortTerm = <const T extends string>(
  sortableFields: readonly T[],
) =>
  z.string().transform((term, ctx) => {
    const direction = term.startsWith('-')
      ? ('desc' as const)
      : ('asc' as const);
    const field = term.replace(/^-/, '');

    if (!(sortableFields as readonly string[]).includes(field)) {
      ctx.addIssue({
        code: 'custom',
        message: `Cannot sort by "${field}". Allowed: ${sortableFields.join(', ')}`,
      });
      return z.NEVER;
    }
    return { field: field as T, direction };
  });

type SortExpr<TField extends string> = TField | `-${TField}`;

export const createPageQuerySchema = <
  const F extends readonly [string, ...string[]],
>(
  sortableFields: F,
  defaultSort: NoInfer<SortExpr<F[number]>>,
) =>
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    size: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .string()
      .default(defaultSort)
      .transform((value) => value.split(',').filter(Boolean))
      .pipe(
        z
          .array(sortTerm(sortableFields))
          .min(1)
          .max(3)
          .refine(
            (terms) => new Set(terms.map((t) => t.field)).size === terms.length,
            'Duplicate sort fields',
          ),
      ),
  });

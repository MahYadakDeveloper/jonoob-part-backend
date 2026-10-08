import { z } from 'zod';

type SortExpr<K extends string> = K | `-${K}`;
type SortTerm<K extends string> = { field: K; direction: 'asc' | 'desc' };

const sortTerm = <K extends string>(
  fields: readonly [K, ...K[]],
): z.ZodType<SortTerm<K>, string> =>
  z.string().transform((term, ctx): SortTerm<K> => {
    const direction = term.startsWith('-') ? 'desc' : 'asc';
    const field = term.replace(/^-/, '');

    if (!(fields as readonly string[]).includes(field)) {
      ctx.addIssue({
        code: 'custom',
        message: `Cannot sort by "${field}". Allowed: ${fields.join(', ')}`,
      });
      return z.NEVER;
    }
    return { field: field as K, direction };
  });

export const createPageQuerySchema = <K extends string>(
  sortableFields: readonly [K, ...K[]],
  defaultSort: NoInfer<SortExpr<K>>,
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

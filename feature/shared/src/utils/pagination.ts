import { z } from 'zod';

type SortExpr<K extends string> = K | `-${K}`;
type SortTerm<K extends string> = { field: K; direction: 'asc' | 'desc' };

export function createPageQuerySchema<K extends string>(
  fields: readonly [K, ...K[]],
  defaultSort: NoInfer<readonly [SortExpr<K>, ...SortExpr<K>[]]>,
) {
  return z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    size: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .string()
      .optional()
      .transform((v) => (v?.trim() ? v : defaultSort.join(',')))
      .transform((v) => v.split(',').filter(Boolean))
      .pipe(
        z
          .array(sortTerm(fields))
          .min(1)
          .max(3)
          .refine(
            (terms) => new Set(terms.map((t) => t.field)).size === terms.length,
            'Duplicate sort fields',
          ),
      ),
  });
}

function sortTerm<K extends string>(fields: readonly [K, ...K[]]) {
  const allowed: ReadonlySet<string> = new Set(fields);
  const isField = (v: string): v is K => allowed.has(v);

  return z.string().transform((raw, ctx): SortTerm<K> => {
    const term = raw.trim();
    const direction = term.startsWith('-') ? 'desc' : 'asc';
    const field = direction === 'desc' ? term.slice(1) : term;

    if (!isField(field)) {
      ctx.addIssue({
        code: 'custom',
        message: `Cannot sort by "${field}". Allowed: ${fields.join(', ')}`,
      });
      return z.NEVER;
    }
    return { field, direction };
  });
}

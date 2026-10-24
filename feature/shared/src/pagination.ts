import {
  asc,
  Column,
  DBQueryConfigOrderByObject,
  desc,
  getColumns,
  SQL,
  Table,
} from 'drizzle-orm';
import { z } from 'zod';

export interface PageResult<T, TPagination extends Pagination> {
  page: Page<T, TPagination>;
}

export interface PageFilters {}

export interface PageSort {
  field: PageSortField;

  direction: SortDirection;
}

export type SortDirection = 'asc' | 'desc';

export type PageSortField = 'createdAt';

export type Page<
  T,
  TPagination extends Pagination,
> = TPagination extends OffsetPagination
  ? OffsetPage<T>
  : TPagination extends CursorPagination
    ? CursorPage<T>
    : never;

export interface OffsetPage<T> {
  items: readonly T[];

  number: number;
  size: number;
  totalItems: number;
  totalPages: number;

  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CursorPage<T> {
  items: readonly T[];

  size: number;
  hasNext: boolean;
  hasPrevious: boolean;

  nextCursor?: string;
}

export type Pagination = OffsetPagination | CursorPagination;

export interface OffsetPagination {
  type: 'offset';

  page: number;

  size: number;
}

export interface CursorPagination {
  type: 'cursor';

  after?: string;

  size: number;
}

const NON_SORTABLE = ['json', 'array', 'buffer'] as const;
type NonSortable = (typeof NON_SORTABLE)[number];
export const NON_SORTABLE_SET: ReadonlySet<string> = new Set(NON_SORTABLE);

export type SortableKeys<T extends Table> = {
  [K in keyof T['_']['columns']]: T['_']['columns'][K]['_']['dataType'] extends NonSortable
    ? never
    : K;
}[keyof T['_']['columns']];

export type PageCriteria<TTable extends Table> = {
  sort: {
    field: SortableKeys<TTable>;
    direction: 'asc' | 'desc';
  }[];
  page: number;
  size: number;
};

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

// ------------------

export type SortSpec<K extends PropertyKey = string> = readonly {
  field: K;
  direction: SortDirection;
}[];

type Comparable = string | number | bigint | boolean | Date | null | undefined;

const compareValues = (a: Comparable, b: Comparable): number => {
  if (a == null || b == null) {
    return a == null ? (b == null ? 0 : 1) : -1;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  return a < b ? -1 : a > b ? 1 : 0;
};

export function sortBy<T, K extends keyof T>(
  items: readonly T[],
  sort: SortSpec<K>,
): T[] {
  return items.toSorted((x, y) => {
    for (const { field, direction } of sort) {
      const result = compareValues(
        x[field] as Comparable,
        y[field] as Comparable,
      );
      if (result !== 0) return direction === 'asc' ? result : -result;
    }
    return 0;
  });
}

export const sortableFields = <T extends Table>(table: T) => {
  const fields = Object.entries(getColumns(table) as Record<string, Column>)
    .filter(([, col]) => !NON_SORTABLE_SET.has(col.dataType))
    .map(([name]) => name);

  if (fields.length === 0) {
    throw new Error('Table has no sortable columns');
  }

  return fields as unknown as readonly [SortableKeys<T>, ...SortableKeys<T>[]];
};

export const orderByQuery = <TTable extends Table>(
  sort: { field: SortableKeys<TTable>; direction: 'asc' | 'desc' }[],
): DBQueryConfigOrderByObject<TTable['_']['columns']> => {
  const result: DBQueryConfigOrderByObject<TTable['_']['columns']> = {};

  for (const { field, direction } of sort) {
    if (!(field in result)) result[field] = direction;
  }

  return result;
};

export const orderBy = <TTable extends Table>(
  table: TTable,
  sort: { field: SortableKeys<TTable>; direction: 'asc' | 'desc' }[],
): SQL[] => {
  const columns = getColumns(table) as Record<string, Column>;

  return sort.map(({ field, direction }) => {
    const column = columns[field as string];

    if (!column) {
      throw new Error(`Unknown sort field: ${String(field)}`);
    }

    return direction === 'asc' ? asc(column) : desc(column);
  });
};

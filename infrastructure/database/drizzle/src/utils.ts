import {
  asc,
  Column,
  DBQueryConfigOrderByObject,
  desc,
  getColumns,
  sql,
  Table,
  type SQL,
} from 'drizzle-orm';

export function sqlCase<T>(
  cases: Array<{
    when: SQL;
    then: SQL<T>;
  }>,
  otherwise: SQL<T>,
): SQL<T> {
  return sql`
    CASE
      ${sql.join(
        cases.map(({ when, then }) => sql`WHEN ${when} THEN ${then}`),
        sql` `,
      )}
      ELSE ${otherwise}
    END
  `;
}

const NON_SORTABLE = ['json', 'array', 'buffer'] as const;
type NonSortable = (typeof NON_SORTABLE)[number];
const NON_SORTABLE_SET: ReadonlySet<string> = new Set(NON_SORTABLE);

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

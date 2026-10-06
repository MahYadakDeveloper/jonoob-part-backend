import { Column, getColumns, sql, Table, type SQL } from 'drizzle-orm';

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

type NonSortable = 'json' | 'array' | 'buffer';

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

const NON_SORTABLE = new Set(['json', 'array', 'buffer']);

export const sortableFields = <T extends Table>(table: T) => {
  const fields = Object.entries(getColumns(table) as Record<string, Column>)
    .filter(([, col]) => !NON_SORTABLE.has(col.dataType))
    .map(([name]) => name);

  if (fields.length === 0) {
    throw new Error('Table has no sortable columns');
  }

  return fields as unknown as readonly [SortableKeys<T>, ...SortableKeys<T>[]];
};

export const orderBy = <TTable extends Table>(
  sort: { field: SortableKeys<TTable>; direction: 'asc' | 'desc' }[],
) => {
  const _orderBy: Partial<Record<SortableKeys<TTable>, 'asc' | 'desc'>> = {};
  for (const { field, direction } of sort) {
    _orderBy[field] ??= direction; // first occurrence of a field wins
  }

  return _orderBy;
};

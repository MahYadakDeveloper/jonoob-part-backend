import { getColumns } from 'drizzle-orm';
import {
  getTableConfig,
  type PgColumn,
  type PgTable,
} from 'drizzle-orm/pg-core';
import {
  buildDbError,
  type DbErrorFactory,
  type DbErrorRule,
} from '../db-error';

type ColumnKey<T extends PgTable> = Extract<keyof T['_']['columns'], string>;

/** Key values of the violated constraint, indexed by the table's column keys. */
type Keys<T extends PgTable> = Partial<Record<ColumnKey<T>, string>>;
type Make<T extends PgTable> = DbErrorRule<Keys<T>>;

const signature = (names: readonly string[]) => [...names].sort().join(',');

function columnNames<T extends PgTable>(
  table: T,
  keys: readonly ColumnKey<T>[],
): string[] {
  const columns = table as unknown as Record<string, PgColumn | undefined>;
  return keys.map((key) => {
    const column = columns[key];
    if (!column) throw new Error(`Unknown column "${key}"`);
    return column.name;
  });
}

export function fkName<T extends PgTable>(
  table: T,
  ...keys: ColumnKey<T>[]
): string {
  const config = getTableConfig(table);
  const wanted = signature(columnNames(table, keys));
  const fk = config.foreignKeys.find(
    (f) => signature(f.reference().columns.map((c) => c.name)) === wanted,
  );
  if (!fk) throw new Error(`${config.name}: no foreign key on (${wanted})`);
  // unnamed: drizzle-kit creates `<getName() without _fk>_fkey`, not drizzle-orm's legacy `_fk`
  return fk.isNameExplicit()
    ? fk.getName()
    : `${fk.getName().slice(0, -3)}_fkey`;
}

export function uniqueName<T extends PgTable>(
  table: T,
  ...keys: ColumnKey<T>[]
): string {
  const config = getTableConfig(table);
  const wanted = signature(columnNames(table, keys));

  const named = config.uniqueConstraints.find(
    (u) => signature(u.columns.map((c) => c.name)) === wanted,
  );
  if (named) {
    // unnamed constraint: Postgres default `<table>_<cols>_key`
    return (
      named.getName() ??
      `${config.name}_${named.columns.map((c) => c.name).join('_')}_key`
    );
  }

  // column-level `.unique()` is not listed in `uniqueConstraints`
  const column =
    keys.length === 1
      ? config.columns.find((c) => c.name === wanted)
      : undefined;
  const columnConstraint = column?.isUnique ? column.uniqueName : undefined;
  if (columnConstraint) return columnConstraint;

  throw new Error(`${config.name}: no unique constraint on (${wanted})`);
}

export function pkName(table: PgTable): string {
  const config = getTableConfig(table);
  const composite = config.primaryKeys[0];
  // unnamed: drizzle-kit creates Postgres' `<table>_pkey`, not drizzle-orm's legacy `_pk`
  if (composite?.isNameExplicit) return composite.getName();
  if (composite || config.columns.some((c) => c.primary)) {
    return `${config.name}_pkey`;
  }
  throw new Error(`${config.name}: no primary key`);
}

/** Check constraints have no columns, so only their (explicit) name can be verified. */
export function checkName(table: PgTable, name: string): string {
  const config = getTableConfig(table);
  if (!config.checks.some((c) => c.name === name)) {
    throw new Error(`${config.name}: no check constraint "${name}"`);
  }
  return name;
}

function bind<T extends PgTable>(
  table: T,
  name: string,
  make: Make<T>,
): Record<string, DbErrorFactory> {
  const keyOf = new Map(
    Object.entries(getColumns(table)).map(([key, c]) => [c.name, key]),
  );
  return {
    [name]: ({ keys }) =>
      buildDbError(
        make,
        Object.fromEntries(
          Object.entries(keys).map(([column, v]) => [
            keyOf.get(column) ?? column,
            v,
          ]),
        ) as Keys<T>,
      ),
  };
}

/**
 * Typed rule entries for `PgErrorRules.constraints`; spread them into it.
 * `keys` come from the violation detail, so they describe the written row (insert/update).
 */
export const onFk = <T extends PgTable>(
  table: T,
  key: ColumnKey<T> | ColumnKey<T>[],
  make: Make<T>,
) => bind(table, fkName(table, ...([] as ColumnKey<T>[]).concat(key)), make);

export const onPk = <T extends PgTable>(table: T, make: Make<T>) =>
  bind(table, pkName(table), make);

export const onUq = <T extends PgTable>(
  table: T,
  key: ColumnKey<T> | ColumnKey<T>[],
  make: Make<T>,
) =>
  bind(table, uniqueName(table, ...([] as ColumnKey<T>[]).concat(key)), make);

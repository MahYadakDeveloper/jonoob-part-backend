import type { DbErrorInfo, DbErrorKind } from '../db-error';

/** Postgres SQLSTATE -> database-agnostic kind. */
const PG_ERROR_KIND: Readonly<Record<string, DbErrorKind>> = {
  '23505': 'unique',
  '23503': 'foreignKey',
  '23514': 'check',
  '23502': 'notNull',
  '22P02': 'invalidInput',
  '22003': 'outOfRange',
  '23P01': 'exclusion',
  '40001': 'serialization',
  '40P01': 'deadlock',
  '55P03': 'lockTimeout',
};

// "Key (a, b)=(1, 2) already exists." / "... is not present in table ..." / "... is still referenced ..."
const KEY_DETAIL = /^Key \((.+?)\)=\((.*)\) (?:is|already)\b/;

const unquote = (name: string) => name.replace(/^"|"$/g, '');
const asString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

export function parseKeys(detail: unknown): Record<string, string> {
  const match = typeof detail === 'string' ? KEY_DETAIL.exec(detail) : null;
  const columns = match?.[1]?.split(', ');
  const values = match?.[2]?.split(', ');
  if (!columns || !values || columns.length !== values.length) return {};
  return Object.fromEntries(
    columns.map((c, i) => [unquote(c), values[i] ?? '']),
  );
}

const SQLSTATE = /^[0-9A-Z]{5}$/;

/** Finds the driver error, unwrapping Drizzle's `cause` chain. */
export function classifyPgError(error: unknown): DbErrorInfo | null {
  let current: unknown = error;
  for (
    let depth = 0;
    depth < 5 && typeof current === 'object' && current !== null;
    depth++
  ) {
    const e = current as Record<string, unknown>;
    // Bun SQL: SQLSTATE in `errno` (`code` is "ERR_POSTGRES_*"); pg / postgres.js: in `code`
    const code = [e['errno'], e['code']]
      .map(asString)
      .find((c) => c !== undefined && SQLSTATE.test(c));
    if (code !== undefined) {
      return {
        kind: PG_ERROR_KIND[code],
        // `pg` uses constraint/table, `postgres.js` uses constraint_name/table_name
        constraint: asString(e['constraint']) ?? asString(e['constraint_name']),
        table: asString(e['table']) ?? asString(e['table_name']),
        keys: parseKeys(e['detail']),
      };
    }
    current = e['cause'];
  }
  return null;
}

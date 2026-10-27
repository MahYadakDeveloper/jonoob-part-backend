import { getTableName, is, Table } from 'drizzle-orm';
import type { LockConfig, PgSelectConfig } from 'drizzle-orm/pg-core';

type JoinType = NonNullable<PgSelectConfig['joins']>[number]['joinType'];

/** What the lock rules need to know about a select query. */
export interface SelectShape {
  from: string | undefined;
  joins: ReadonlyArray<{ alias: string | undefined; type: JoinType }>;
  groupBy: boolean;
  having: boolean;
  distinct: boolean;
  setOperators: boolean;
}

// Which tables a join NULL-extends. Record<JoinType, ...> fails to compile if Drizzle adds/removes a join type.
const NULL_EXTENDS: Record<JoinType, { previous: boolean; joined: boolean }> = {
  inner: { previous: false, joined: false },
  cross: { previous: false, joined: false },
  left: { previous: false, joined: true },
  right: { previous: true, joined: false },
  full: { previous: true, joined: true },
};

export function readSelectShape(query: object): SelectShape | null {
  // `config` is internal (not in Drizzle's public typings), so this is the only cast.
  const config = (query as { config?: PgSelectConfig }).config;
  if (!config) return null;

  return {
    from: is(config.table, Table) ? getTableName(config.table) : undefined,
    joins: (config.joins ?? []).map(({ alias, joinType }) => ({
      alias,
      type: joinType,
    })),
    groupBy: (config.groupBy?.length ?? 0) > 0,
    having: config.having !== undefined,
    distinct: Boolean(config.distinct),
    setOperators: (config.setOperators?.length ?? 0) > 0,
  };
}

/** Returns why `FOR <strength>` cannot be applied, or null if it can. `of` = names of tables to lock. */
export function lockViolation(
  shape: SelectShape,
  of: readonly string[],
): string | null {
  if (shape.setOperators)
    return 'FOR UPDATE is not allowed with UNION/INTERSECT/EXCEPT';
  if (shape.distinct) return 'FOR UPDATE is not allowed with DISTINCT';
  if (shape.groupBy) return 'FOR UPDATE is not allowed with GROUP BY';
  if (shape.having) return 'FOR UPDATE is not allowed with HAVING';

  const visible = new Set<string>();
  const nullable = new Set<string>();
  if (shape.from) visible.add(shape.from);

  for (const { alias, type } of shape.joins) {
    const rule = NULL_EXTENDS[type];
    if (rule.previous) for (const name of visible) nullable.add(name);
    if (alias) {
      visible.add(alias);
      if (rule.joined) nullable.add(alias);
    }
  }

  if (of.length === 0) {
    return nullable.size > 0
      ? 'Query has an outer join: pass `of` with the table(s) to lock (nullable side cannot be locked)'
      : null;
  }

  for (const name of of) {
    if (shape.from !== undefined && !visible.has(name)) {
      return `"${name}" in \`of\` is not in FROM/JOIN (use the alias if the table is aliased)`;
    }
    if (nullable.has(name)) {
      return `"${name}" is on the nullable side of an outer join and cannot be locked`;
    }
  }
  return null;
}

/** Throws if the query cannot take a row lock. Aggregates/window functions are left to Postgres. */
export function assertLockable(query: object, of?: LockConfig['of']): void {
  const shape = readSelectShape(query);
  if (!shape) return;

  const tables = Array.isArray(of) ? of : of ? [of] : [];
  const problem = lockViolation(
    shape,
    tables.map((t) => getTableName(t)),
  );
  if (problem) throw new Error(problem);
}

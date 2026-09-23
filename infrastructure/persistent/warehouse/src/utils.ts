import { sql, type SQL } from 'drizzle-orm';

export function sqlCase<T>(
  cases: Array<{
    when: SQL;
    then: T;
  }>,
  otherwise: T,
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

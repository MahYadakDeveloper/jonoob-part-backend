import { sql, SQL } from 'drizzle-orm';
import { Duration } from '../types/_';

export function subtractDuration(date: Date, duration: Duration): Date {
  const result = new Date(date);

  switch (duration.unit) {
    case 'minute':
      result.setMinutes(result.getMinutes() - duration.value);
      break;

    case 'hour':
      result.setHours(result.getHours() - duration.value);
      break;

    case 'week':
      result.setDate(result.getDate() - duration.value * 7);
      break;

    case 'month':
      result.setMonth(result.getMonth() - duration.value);
      break;

    case 'year':
      result.setFullYear(result.getFullYear() - duration.value);
      break;
  }

  return result;
}

export function addDuration(date: Date, duration: Duration): Date {
  const result = new Date(date);

  switch (duration.unit) {
    case 'minute':
      result.setMinutes(result.getMinutes() + duration.value);
      break;

    case 'hour':
      result.setHours(result.getHours() + duration.value);
      break;

    case 'week':
      result.setDate(result.getDate() + duration.value * 7);
      break;

    case 'month':
      result.setMonth(result.getMonth() + duration.value);
      break;

    case 'year':
      result.setFullYear(result.getFullYear() + duration.value);
      break;
  }

  return result;
}

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

import { Duration } from './types';

export type PartialBy<T, K extends keyof T> = T extends unknown
  ? Omit<T, K> & Partial<Pick<T, K>>
  : never;

export type RequiredBy<T, K extends keyof T> = T extends unknown
  ? Omit<T, K> & Required<Pick<T, K>>
  : never;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function subtractDuration(date: Date, duration: Duration): Date {
  const result = new Date(date);

  switch (duration.unit) {
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

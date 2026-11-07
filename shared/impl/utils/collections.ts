export function groupMap<Row, Key, Out>(
  rows: readonly Row[],
  key: (row: Row) => Key,
  toOut: (group: readonly Row[]) => Out,
): Out[] {
  return Array.from(Map.groupBy(rows, key).values(), toOut);
}

export type DuplicateStrategy<T> =
  | 'last'
  | 'first'
  | 'throw'
  | ((existing: T, incoming: T) => T);

// Build a Map from a list, keyed by a property name or by a key function.
// `onDuplicate` decides what happens when two items produce the same key:
//   'last'  (default) keep the later item
//   'first' keep the earlier item
//   'throw' throw an Error
//   fn      merge: receives (existing, incoming) and returns the value to keep
export function toMap<T, K extends keyof T>(
  items: readonly T[],
  key: K,
  onDuplicate?: DuplicateStrategy<T>,
): Map<T[K], T>;
export function toMap<T, K>(
  items: readonly T[],
  key: (item: T) => K,
  onDuplicate?: DuplicateStrategy<T>,
): Map<K, T>;
export function toMap<T>(
  items: readonly T[],
  key: keyof T | ((item: T) => unknown),
  onDuplicate: DuplicateStrategy<T> = 'last',
): Map<unknown, T> {
  const keyFn =
    typeof key === 'function' ? key : (item: T): unknown => item[key];
  const map = new Map<unknown, T>();

  for (const item of items) {
    const k = keyFn(item);

    if (!map.has(k)) {
      map.set(k, item);
      continue;
    }

    if (onDuplicate === 'first') continue;
    if (onDuplicate === 'last') map.set(k, item);
    else if (onDuplicate === 'throw') {
      throw new Error(`Duplicate key: ${String(k)}`);
    } else {
      map.set(k, onDuplicate(map.get(k) as T, item));
    }
  }

  return map;
}

export {};

type DuplicateStrategy<T> =
  | 'last'
  | 'first'
  | 'throw'
  | ((existing: T, incoming: T) => T);

declare global {
  interface Array<T> {
    toMap<K extends keyof T>(
      key: K,
      onDuplicate?: DuplicateStrategy<T>,
    ): Map<T[K], T>;
    toMap<K>(
      key: (item: T) => K,
      onDuplicate?: DuplicateStrategy<T>,
    ): Map<K, T>;
  }
}

Array.prototype.toMap = function (
  this: any[],
  key: any,
  onDuplicate: DuplicateStrategy<any> = 'last',
) {
  const keyFn = typeof key === 'function' ? key : (i: any) => i[key];
  const map = new Map<any, any>();

  for (const item of this) {
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
      map.set(k, onDuplicate(map.get(k), item));
    }
  }

  return map;
};

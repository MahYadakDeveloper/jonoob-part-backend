declare global {
  interface Array<T> {
    toMap<K, V>(
      keySelector: (item: T) => K,
      valueSelector: (item: T) => V,
    ): Map<K, V>;
  }
}

Array.prototype.toMap = function <T, K, V>(
  this: T[],
  keySelector: (item: T) => K,
  valueSelector: (item: T) => V,
): Map<K, V> {
  const map = new Map<K, V>();

  for (const item of this) {
    const key = keySelector(item);

    if (map.has(key)) {
      throw new Error(`Duplicate key: ${String(key)}`);
    }

    map.set(key, valueSelector(item));
  }

  return map;
};
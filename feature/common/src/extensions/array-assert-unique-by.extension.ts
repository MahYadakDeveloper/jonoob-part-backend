declare global {
  interface Array<T> {
    assertUniqueBy<K>(
      selector: (item: T) => K,
      onDuplicate: (key: K) => Error,
    ): void;
  }
}

Array.prototype.assertUniqueBy = function <T, K>(
  this: T[],
  selector: (item: T) => K,
  onDuplicate: (key: K) => Error,
): void {
  const seen = new Set<K>();

  for (const item of this) {
    const key = selector(item);

    if (seen.has(key)) {
      throw onDuplicate(key);
    }

    seen.add(key);
  }
};

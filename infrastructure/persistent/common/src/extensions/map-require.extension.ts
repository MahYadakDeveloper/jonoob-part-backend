declare global {
  interface Map<K, V> {
    require(): Map<K, NonNullable<V>>;
  }
}

Map.prototype.require = function <K, V>(
  this: Map<K, V>,
): Map<K, NonNullable<V>> {
  for (const [key, value] of this) {
    if (value == null) {
      throw new Error(`Value for key "${String(key)}" is null.`);
    }
  }

  return this as Map<K, NonNullable<V>>;
};

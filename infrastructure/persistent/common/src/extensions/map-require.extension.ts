declare global {
  interface Map<K, V> {
    require(onMissing: (key: K, value: V) => Error): Map<K, NonNullable<V>>;
  }
}

Map.prototype.require = function <K, V>(
  this: Map<K, V>,
  onMissing: (key: K, value: V) => Error,
): Map<K, NonNullable<V>> {
  for (const [key, value] of this) {
    if (value == null) {
      throw onMissing(key, value);
    }
  }

  return this as Map<K, NonNullable<V>>;
};

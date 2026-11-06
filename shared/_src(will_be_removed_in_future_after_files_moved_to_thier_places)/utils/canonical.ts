const stableReplacer = (_key: string, value: unknown): unknown => {
  if (typeof value === 'bigint') return value.toString();

  if (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    );
  }
  return value;
};

export const canonicalize = (value: unknown): string =>
  JSON.stringify(value, stableReplacer);

export const unordered = <T>(items: readonly T[]): string[] =>
  items.map(canonicalize).sort();

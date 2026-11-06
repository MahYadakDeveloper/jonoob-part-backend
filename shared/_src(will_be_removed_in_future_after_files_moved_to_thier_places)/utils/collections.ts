export function groupMap<Row, Key, Out>(
  rows: readonly Row[],
  key: (row: Row) => Key,
  toOut: (group: readonly Row[]) => Out,
): Out[] {
  return Array.from(Map.groupBy(rows, key).values(), toOut);
}

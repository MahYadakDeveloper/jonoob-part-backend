import { MovementPayload } from './movement.repository';

export const canonical = ({
  direction,
  source,
  items,
}: MovementPayload): string =>
  JSON.stringify({
    direction,
    source,
    items: items
      .map(({ stockId, quantity }) => [stockId, quantity] as const)
      .sort(([a, qa], [b, qb]) => a.localeCompare(b) || qa - qb),
  });

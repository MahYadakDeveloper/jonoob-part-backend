import { merchandiseLine } from '@infra/db-drizzle/schema';
import type { MerchandiseLine } from '../types/merchandise-line';

type MerchandiseLineRow = typeof merchandiseLine.$inferSelect;

function toItemBase(row: MerchandiseLineRow) {
  return {
    productId: row.productId,
    displayName: row.displayName,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    lineTotal: row.lineTotal,
  };
}

export function toMerchandiseLines(
  rows: MerchandiseLineRow[],
): MerchandiseLine[] {
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const bundleItems = new Map<string, MerchandiseLineRow[]>();
  const topLevelRows: MerchandiseLineRow[] = [];

  for (const row of rows) {
    if (row.bundleId === null) {
      topLevelRows.push(row);
      continue;
    }

    const bundle = rowsById.get(row.bundleId);
    if (!bundle) {
      throw new Error(
        `Merchandise line ${row.id} references missing bundle ${row.bundleId}`,
      );
    }
    if (bundle.kind !== 'bundle' || bundle.bundleId !== null) {
      throw new Error(
        `Merchandise line ${row.id} references a non-bundle parent ${row.bundleId}`,
      );
    }
    if (row.kind !== 'leaf' || row.discount !== null) {
      throw new Error(
        `Bundle item ${row.id} must be an undiscounted leaf`,
      );
    }

    const items = bundleItems.get(row.bundleId) ?? [];
    items.push(row);
    bundleItems.set(row.bundleId, items);
  }

  return topLevelRows
    .toSorted((left, right) => left.position - right.position)
    .map((row): MerchandiseLine => {
      const item = toItemBase(row);

      if (row.kind === 'leaf') {
        return {
          ...item,
          kind: 'leaf',
          ...(row.discount === null ? {} : { discount: row.discount }),
        };
      }

      return {
        ...item,
        kind: 'bundle',
        ...(row.discount === null ? {} : { discount: row.discount }),
        items: (bundleItems.get(row.id) ?? [])
          .toSorted((left, right) => left.position - right.position)
          .map(toItemBase),
      };
    });
}

type MerchandiseLineInsert = typeof merchandiseLine.$inferInsert;
type MerchandiseLineItemInsert = Omit<MerchandiseLineInsert, 'bundleId'>;

export type MerchandiseLineInsertPlan =
  | {
      kind: 'leaf';
      leaf: MerchandiseLineInsert;
    }
  | {
      kind: 'bundle';
      bundle: MerchandiseLineInsert;
      items: MerchandiseLineItemInsert[];
    };

export function toMerchandiseLineInsertPlans(
  related:
    | {
        orderId: string;
      }
    | { saleId: string },
  lines: MerchandiseLine[],
): MerchandiseLineInsertPlan[] {
  return lines.map((line, position): MerchandiseLineInsertPlan => {
    const lineRow: MerchandiseLineInsert = {
      orderId: null,
      saleId: null,
      ...related,
      bundleId: null,
      kind: line.kind,
      position,
      productId: line.productId,
      displayName: line.displayName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      discount: line.discount ?? null,
    };

    if (line.kind === 'leaf') {
      return { kind: 'leaf', leaf: lineRow };
    }

    if (line.items.length === 0) {
      throw new Error('Bundle must contain at least one item');
    }

    return {
      kind: 'bundle',
      bundle: lineRow,
      items: line.items.map(
        (item, itemPosition): MerchandiseLineItemInsert => ({
          orderId: null,
          saleId: null,
          kind: 'leaf',
          position: itemPosition,
          productId: item.productId,
          displayName: item.displayName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          discount: null,
        }),
      ),
    };
  });
}

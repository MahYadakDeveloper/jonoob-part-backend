# Stocks

How `stocks` works, how managers act on it through labels, and how to change quantities safely.
Warehouses, the storeroom and shelves: [`warehouse-storeroom-guide.md`](./warehouse-storeroom-guide.md).

## 1. Model

- A stock row = **how much of one product is physically at one place** (a warehouse, optionally a shelf). The storeroom is just a warehouse.
- A row exists **only while quantity > 0**. At zero it is deleted immediately (trigger).
- Movements and reservations reference the **product**, never a stock row. That is what makes deletion at zero safe.
- Every stock row has exactly one **label** (a physical sticker). Managers identify stock by label, not by product + place.

| `warehouse_id` | `shelf_id` | Meaning                                                             |
| -------------- | ---------- | ------------------------------------------------------------------- |
| W              | NULL       | In warehouse W, not shelved yet (one row per product and warehouse) |
| W              | S          | On shelf S of warehouse W (one row per product and shelf)           |

---

## 2. Schema

```ts
import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const STOCK_CONSTRAINTS = {
  quantityNonNegative: 'stocks_quantity_non_negative_chk',
} as const;

export const stocks = warehouseSchema.table(
  'stocks',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'restrict' }),

    // NULL = not shelved yet.
    shelfId: uuid('shelf_id'),

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),

    // Never rests at 0: stocks_delete_when_empty removes the row at 0.
    quantity: integer('quantity').default(1).notNull(),

    // Start of the current stocking period at this place (optional column).
    stockedSince: timestamp('stocked_since', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // NULLS NOT DISTINCT: a single "unshelved" row per (product, warehouse). PostgreSQL 15+.
    unique('stocks_product_warehouse_shelf_uq')
      .on(t.productId, t.warehouseId, t.shelfId)
      .nullsNotDistinct(),

    // Shelf must belong to the same warehouse (skipped only when shelf_id is NULL).
    foreignKey({
      name: 'stocks_shelf_warehouse_fk',
      columns: [t.shelfId, t.warehouseId],
      foreignColumns: [shelves.id, shelves.warehouseId],
    }).onDelete('restrict'),

    // >= 0, not > 0: an update may touch 0 for an instant before the trigger deletes the row.
    check(STOCK_CONSTRAINTS.quantityNonNegative, sql`${t.quantity} >= 0`),

    index('stocks_warehouse_idx').on(t.warehouseId),
    index('stocks_shelf_idx')
      .on(t.shelfId)
      .where(sql`${t.shelfId} IS NOT NULL`),
  ],
);
```

| Invariant                                       | Enforced by                     |
| ----------------------------------------------- | ------------------------------- |
| One row per (product, warehouse, shelf)         | `unique ... nullsNotDistinct()` |
| Shelf belongs to the row's warehouse            | composite FK                    |
| Quantity never negative                         | check                           |
| No row rests at 0                               | trigger (section 3)             |
| Warehouse or shelf with stock cannot be deleted | `onDelete: 'restrict'`          |

---

## 3. Delete-when-empty trigger (custom migration)

Drizzle does not manage triggers. Replace `warehouse` with your real schema name.

```sql
CREATE FUNCTION warehouse.stocks_delete_when_empty() RETURNS trigger AS $$
BEGIN
  DELETE FROM warehouse.stocks WHERE id = NEW.id;
  RETURN NULL;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER stocks_delete_when_empty
AFTER INSERT OR UPDATE OF quantity ON warehouse.stocks
FOR EACH ROW WHEN (NEW.quantity = 0)
EXECUTE FUNCTION warehouse.stocks_delete_when_empty();
```

```bash
bunx drizzle-kit generate                                   # tables first
bunx drizzle-kit generate --custom --name=stocks_delete_when_empty
# paste the SQL into the new file, then:
bunx drizzle-kit migrate
```

- Run from the package that owns `drizzle.config.ts` (workspace scripts may not forward `--custom`).
- `drizzle-kit push` does **not** apply custom SQL. Use `migrate`.
- Change it later with a new migration (`CREATE OR REPLACE FUNCTION`); never edit an applied file.
- Smoke test: insert `quantity = 3`, update to `0`, the row (and its label) must disappear.

---

## 4. Labels: how managers act on stock

Stock labels come from your generic helper:

```ts
const STOCK_LABEL_PREFIX = 'S';

export const {
  counter: _,
  freeSeqs: __,
  labels: stockLabels,
} = createLabelTables(warehouseSchema, stocks, STOCK_LABEL_PREFIX);

export const stockLabelRegExp = labelCodeRegExp(STOCK_LABEL_PREFIX);
```

One label per stock row (1:1, FK with cascade): created with the row, deleted with it.

### Rules

- **Issuing:** the manager scans the label on the shelf. The client sends the label and a quantity, never product + place. The label tells the system exactly which stock to deduct from.
- **New or moved stock:** the manager takes a label from the system and **sticks it on the shelf** where the stock will be kept. This applies to receiving, to moves inside the same warehouse and to transfers to another warehouse.
- **Destination already holds this product?** Quantities merge into the existing row. No new label is issued; the response returns the existing one.
- **Emptied stock:** its row and label are deleted. The response says `labelVoided: true` and the manager removes the sticker. Scanning a voided label returns `LABEL_NOT_FOUND`.

| Action                         | Manager scans                     | System returns                                                          | Manager physically                                                                    |
| ------------------------------ | --------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Receive / store new stock      | nothing (picks product and place) | label (new, or the existing one on merge)                               | sticks a new label on the shelf                                                       |
| Issue                          | label on the source shelf         | `remaining`, `labelVoided`                                              | removes the label if voided                                                           |
| Move (same or other warehouse) | source label                      | destination label, `isNewLabel`, `sourceRemaining`, `sourceLabelVoided` | sticks destination label on the destination shelf; removes the source label if voided |

### Endpoints (manager only)

| Method | Path                      | Body                                                     | Errors                                                            |
| ------ | ------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `POST` | `/manager/stocks/receive` | `{ productId, warehouseId, shelfId?, quantity }`         | `422 INVALID_QUANTITY`                                            |
| `POST` | `/manager/stocks/issue`   | `{ label, quantity }`                                    | `404 LABEL_NOT_FOUND`, `409 INSUFFICIENT_STOCK`                   |
| `POST` | `/manager/stocks/move`    | `{ fromLabel, quantity, to: { warehouseId, shelfId? } }` | `404 LABEL_NOT_FOUND`, `409 INSUFFICIENT_STOCK`, `422 SAME_PLACE` |

### Code

The sketch assumes `stockLabels` has a `code` column and a unique `stockId` FK. Adjust to the names `createLabelTables` really generates. Every function below runs inside a transaction **and holds `lockProduct`** (section 5).

```ts
import { and, eq, isNull, sql } from 'drizzle-orm';

export type Place = { warehouseId: string; shelfId: string | null };

const placeCond = (productId: string, p: Place) =>
  and(
    eq(stocks.productId, productId),
    eq(stocks.warehouseId, p.warehouseId),
    p.shelfId === null ? isNull(stocks.shelfId) : eq(stocks.shelfId, p.shelfId),
  );

async function findStockByLabel(tx: Tx, code: string) {
  if (!stockLabelRegExp.test(code)) throw new InvalidLabelError();
  const [row] = await tx
    .select({
      id: stocks.id,
      productId: stocks.productId,
      warehouseId: stocks.warehouseId,
      shelfId: stocks.shelfId,
      quantity: stocks.quantity,
    })
    .from(stockLabels)
    .innerJoin(stocks, eq(stocks.id, stockLabels.stockId))
    .where(eq(stockLabels.code, code));
  if (!row) throw new LabelNotFoundError(); // unknown, or its stock was emptied
  return row;
}

/** Adds n at a place. Creates the row and its label only when the place is empty. */
async function addAt(tx: Tx, productId: string, place: Place, n: number) {
  const [existing] = await tx
    .select({ id: stocks.id })
    .from(stocks)
    .where(placeCond(productId, place));

  if (existing) {
    await tx
      .update(stocks)
      .set({ quantity: sql`${stocks.quantity} + ${n}` })
      .where(eq(stocks.id, existing.id));
    const [l] = await tx
      .select({ code: stockLabels.code })
      .from(stockLabels)
      .where(eq(stockLabels.stockId, existing.id));
    return { label: l.code, isNewLabel: false };
  }

  const [row] = await tx
    .insert(stocks)
    .values({ productId, ...place, quantity: n })
    .returning({ id: stocks.id });
  const [l] = await tx
    .insert(stockLabels)
    .values({ stockId: row.id })
    .returning({ code: stockLabels.code });
  return { label: l.code, isNewLabel: true };
}

export function receive(db: Db, productId: string, place: Place, n: number) {
  if (!Number.isInteger(n) || n <= 0) throw new InvalidQuantityError();
  return db.transaction(async (tx) => {
    await lockProduct(tx, productId);
    return addAt(tx, productId, place, n);
  });
}

export function issue(db: Db, label: string, n: number) {
  if (!Number.isInteger(n) || n <= 0) throw new InvalidQuantityError();
  return db.transaction(async (tx) => {
    const { productId } = await findStockByLabel(tx, label); // which product to lock
    await lockProduct(tx, productId);
    const stock = await findStockByLabel(tx, label); // re-read under the lock
    if (stock.quantity < n) throw new InsufficientStockError();

    const remaining = stock.quantity - n;
    await tx
      .update(stocks)
      .set({ quantity: remaining })
      .where(eq(stocks.id, stock.id));
    return { remaining, labelVoided: remaining === 0 }; // 0: trigger deletes row + label
  });
}

export function move(
  db: Db,
  p: { fromLabel: string; quantity: number; to: Place },
) {
  if (!Number.isInteger(p.quantity) || p.quantity <= 0)
    throw new InvalidQuantityError();
  return db.transaction(async (tx) => {
    const { productId } = await findStockByLabel(tx, p.fromLabel);
    await lockProduct(tx, productId);
    const src = await findStockByLabel(tx, p.fromLabel);

    if (src.warehouseId === p.to.warehouseId && src.shelfId === p.to.shelfId) {
      throw new SamePlaceError();
    }
    if (src.quantity < p.quantity) throw new InsufficientStockError();

    const remaining = src.quantity - p.quantity;
    await tx
      .update(stocks)
      .set({ quantity: remaining })
      .where(eq(stocks.id, src.id));
    const dest = await addAt(tx, productId, p.to, p.quantity);

    return {
      toLabel: dest.label,
      isNewLabel: dest.isNewLabel,
      sourceRemaining: remaining,
      sourceLabelVoided: remaining === 0,
    };
  });
}
```

Stock counts and adjustments should also identify the stock by label.

### Do not create labels with `ON CONFLICT DO NOTHING`

If the label allocator is a `BEFORE INSERT` trigger on a counter, it still runs when the insert is then skipped, so a sequence number is consumed and the numbering gets a gap. That is why `addAt` checks for an existing row first (safe under `lockProduct`) and only inserts a label for a genuinely new row.

---

## 5. Concurrency: lock per product

Movements and reservations no longer lock a stock row. Without a lock, two opposite moves can deadlock and two reservations can both see "enough stock" and oversell. Take a transaction-scoped advisory lock at the start of **every** operation that changes stock or checks/creates reservations:

```ts
export async function lockProduct(tx: Tx, productId: string) {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${'stock:' + productId}, 0))`,
  );
}
```

It is released at commit or rollback. Because every writer holds it, the read-then-write code above is safe. Code paths that skip the lock must use an upsert (`ON CONFLICT (product_id, warehouse_id, shelf_id) DO UPDATE SET quantity = stocks.quantity + excluded.quantity`) instead of a plain update.

---

## 6. Reading and availability

```ts
const [{ onHand }] = await db
  .select({ onHand: sql<number>`coalesce(sum(${stocks.quantity}), 0)::int` })
  .from(stocks)
  .where(eq(stocks.productId, productId));
```

(`sum(integer)` returns `bigint`, a string in the driver; the `::int` cast keeps it a number.)

Available for a new reservation = `onHand - activeReserved`, computed **after `lockProduct` in the same transaction** as the reservation insert.

---

## 7. Audit trail

`movement_items` and reservations reference `productId`. Do not add a foreign key to `stocks` or `stockLabels`, because both rows disappear at zero. To keep the trail readable, store the places and the label codes as plain values:

```ts
productId: uuid('product_id').notNull().references(() => products.id),
quantity: integer('quantity').notNull(),
fromWarehouseId: uuid('from_warehouse_id').references(() => warehouses.id),
fromShelfId: uuid('from_shelf_id').references(() => shelves.id),
toWarehouseId: uuid('to_warehouse_id').references(() => warehouses.id),
toShelfId: uuid('to_shelf_id').references(() => shelves.id),
fromLabel: text('from_label'), // snapshot, no FK
toLabel: text('to_label'),     // snapshot, no FK
```

---

## 8. Gotchas

1. Never store a stock `id` long-term. A place that empties and is restocked gets a new row and a new label.
2. Inserting quantity 0 is a silent no-op (the trigger deletes it). Validate `n > 0` in the service.
3. `UPDATE ... RETURNING quantity` can report `0` for a row that is already gone.
4. Unshelved rows (`shelf_id` NULL) have no shelf to stick a label on. Decide where it goes; suggested: on the goods or pallet.
5. A label reaches the system only by scan. Reject malformed codes with `stockLabelRegExp` before querying.
6. Stocking an inactive shelf is not blocked by any constraint. Add a trigger if that matters.

## 9. Test checklist

- [ ] Quantity updated to 0: row and label are gone
- [ ] Second unshelved row for the same product and warehouse: unique violation
- [ ] Shelf from another warehouse: FK violation
- [ ] `issue` more than available: `INSUFFICIENT_STOCK`, quantity unchanged
- [ ] `issue` the full quantity: `labelVoided: true`; scanning the label again: `LABEL_NOT_FOUND`
- [ ] `receive` at a place that already holds the product: merges, `isNewLabel: false`
- [ ] `move` to a new shelf: new label returned; to an occupied one: existing label returned
- [ ] Two opposite moves in parallel: no deadlock
- [ ] Two parallel reservations for the last unit: exactly one succeeds
- [ ] Label numbers stay gap-free after many merges
- [ ] After the last stock on a shelf is emptied, the shelf can be deleted

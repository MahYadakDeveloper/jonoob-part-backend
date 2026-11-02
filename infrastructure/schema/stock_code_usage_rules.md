# Application Code Rules for `warehouse.stocks`

> These rules assume the schema and `0001_stock_seq_allocator.sql` from this package are applied. They have not been run against a real PostgreSQL instance; verify them on a test database.

## Background (needed to understand the rules)

- `stocks.seq` (bigint) is the primary key and is assigned by a `BEFORE INSERT` trigger. Any value you supply is overwritten.
- `stocks.id` (e.g. `S000000000042`) is a **generated** column derived from `seq`. It is unique and is the target of foreign keys from child tables.
- Numbers are gap-free: a rolled-back insert returns its number. After the counter reaches its ceiling, numbers of deleted stocks are reused.
- Immutable after insert: `seq`, `id`, `product_id`, `procurement_id` (enforced by triggers). Updatable: `quantity`, `storage_location`.

---

## 1. Insert

```ts
const [row] = await db
  .insert(stocks)
  .values({
    productId,
    procurementId,            // string | null
    quantity,
    storageLocation: location ?? null,
  })
  .returning();
```

Rules:

- **Do not pass `id`.** It is a generated column.
- **Do not pass `seq`.** The trigger overwrites it, so passing it only misleads readers.
- A duplicate `(product_id, procurement_id)` fails with a unique violation (`23505`). `NULL` procurement is treated as a value (`NULLS NOT DISTINCT`), so there is at most one stock per product with no procurement.
- A plain failing `INSERT` is safe: the error aborts the transaction, which also rolls back the counter increment. No number is lost.

## 2. Upsert (increment if exists, create otherwise)

**Never use `ON CONFLICT` on `stocks`**, including Drizzle's `.onConflictDoNothing()` and `.onConflictDoUpdate()`.

Why: the `BEFORE INSERT` trigger runs before conflict detection. If the statement then inserts nothing, the counter increment is not rolled back and a permanent gap appears.

Use the SQL function instead:

```ts
const result = await db.execute<{ id: string }>(sql`
  SELECT warehouse.add_stock_quantity(
    ${productId}::uuid,
    ${procurementId}::uuid,      -- null is allowed
    ${delta}::integer,
    ${location ?? null}::text
  ) AS id
`);
const stockId = result.rows[0].id;   // node-postgres
// postgres-js: result[0].id
```

Notes:

- It returns the stock label (`id`) as text.
- It first tries `UPDATE quantity = quantity + delta`; if no row exists it inserts. A concurrent insert of the same key is handled by catching `unique_violation` in a savepoint (which also rolls back the counter) and retrying.
- `delta` becomes the initial quantity on insert. A negative result violates `stocks_quantity_non_negative_chk` and raises an error.
- `storage_location` is only used on insert; it does not change an existing row.

## 3. Select

```ts
// by label
await db.select().from(stocks).where(eq(stocks.id, id)).limit(1);

// by product + procurement (null needs isNull)
await db.select().from(stocks).where(
  and(
    eq(stocks.productId, productId),
    procurementId === null
      ? isNull(stocks.procurementId)
      : eq(stocks.procurementId, procurementId),
  ),
).limit(1);
```

Rules:

- `eq(column, null)` is never true in SQL. Use `isNull` for a null `procurementId`.
- Looking up by `id` is fine. Never persist an `id` obtained from a lookup as a long-lived external reference (see section 7).
- `seq` is `bigint`: Drizzle returns a JavaScript `bigint`, and `JSON.stringify` throws on it. Convert at the boundary:

```ts
const toDto = (r: StockRow) => ({ ...r, seq: r.seq.toString() });
```

## 4. Update

Only `quantity` and `storageLocation` may change.

```ts
// absolute value
await db.update(stocks).set({ quantity: 10 }).where(eq(stocks.id, id)).returning();

// relative change: atomic, no read-modify-write
await db.update(stocks)
  .set({ quantity: sql`${stocks.quantity} + ${delta}` })
  .where(eq(stocks.id, id))
  .returning();
```

Rules:

- Use the relative form for stock movements. Reading, computing in JS and writing back races with other writers.
- Updating `seq`, `product_id` or `procurement_id` raises an exception from the triggers (`stocks_seq_immutable`, `stocks_identity_immutable`). Type your patch objects as `Partial<Pick<StockRow, 'quantity' | 'storageLocation'>>` to catch this at compile time.
- `id` cannot be updated (generated column).
- A result below zero violates the check constraint and raises an error. Handle it as a domain error ("insufficient stock").
- An update with an empty `set({})` is invalid in Drizzle; guard against empty patches.

## 5. Delete

```ts
const [deleted] = await db
  .delete(stocks)
  .where(eq(stocks.id, id))
  .returning({ id: stocks.id });
```

What happens:

- The `AFTER DELETE` trigger moves the stock's `seq` into `free_stock_seqs`. It is reused only after the counter has reached `max_seq`.
- If a child table references the stock with `onDelete: 'restrict'`, the delete fails and nothing is released.
- Child rows with `onDelete: 'cascade'` are deleted together with the stock.

After a successful delete you must clean up everything that holds the id **outside** foreign keys: Redis/cache keys, outbox or event-store payloads still being processed, logs used for lookups, POS or other external systems, printed labels.

## 6. "Moving" a stock

`product_id` and `procurement_id` are immutable, so a move is `DELETE` + `INSERT` in one short transaction:

```ts
await db.transaction(async (tx) => {
  const [old] = await tx.delete(stocks).where(eq(stocks.id, id)).returning();
  if (!old) throw new Error('stock not found');
  const [created] = await tx.insert(stocks).values({
    productId: target.productId,
    procurementId: target.procurementId,
    quantity: old.quantity,
    storageLocation: old.storageLocation,
  }).returning();
  return created;
});
```

- It fails if any child row references the stock with `restrict`.
- The new stock gets a new label. After the ceiling is reached, it may receive the same label back if that is the smallest free number.

## 7. Referencing stocks from other tables and contexts

```ts
stockId: text('stock_id')
  .notNull()
  .references(() => stocks.id, { onDelete: 'restrict' }),
// plus an index in the same table definition:
// (t) => [index('<table>_stock_id_idx').on(t.stockId)]
```

- The column must be `text`, matching `stocks.id`.
- **Always add an index on the FK column.** Drizzle does not create it. Without it, every stock delete scans the child table.
- Use `restrict` for history tables (movements, invoices, audit). Use `cascade` only for data that is truly part of the stock.
- Keep `ON UPDATE` as `no action`; `id` never changes.
- A label can be recycled after its stock is deleted. Foreign keys protect database rows only, so references outside FKs (events, caches, logs, other services) can end up pointing to a different stock. Prefer not to store labels in long-lived external records, or purge them on delete.
- Another bounded context (e.g. POS) referencing `stocks` with a database foreign key couples the two contexts. Prefer keeping only the identifier there and synchronizing through domain events.

## 8. Transactions, concurrency and performance

- Every insert into `stocks` takes a row lock on the counter and holds it until the transaction ends. **Inserts into `stocks` are therefore serialized.** Keep those transactions short; no network calls, queues or heavy computation between the insert and commit.
- Do not hold a transaction open across user interaction.
- Deleting stocks does not take the counter lock; only allocation does.

## 9. Error handling

| Situation | Typical error | Suggested handling |
|---|---|---|
| Duplicate product + procurement on plain insert | unique violation `23505` | Use `add_stock_quantity`, or treat as "already exists" |
| Negative quantity | check violation `23514` (`stocks_quantity_non_negative_chk`) | Domain error: insufficient stock |
| Delete blocked by child rows (`restrict`) | foreign key violation `23503` | Domain error: stock has history; archive instead |
| Counter ceiling reached and no free numbers | `program_limit_exceeded` (`54000`), message "stock seq space exhausted" | Alert; raise `max_seq` |
| Update of an immutable column | exception `P0001` (trigger) | Programming error; fix the caller |
| `TRUNCATE` on stocks / pool / counter | exception `P0001` (trigger) | Not allowed; see testing notes |

In recent Drizzle versions the driver error is wrapped in `DrizzleQueryError`; the PostgreSQL code is in `error.cause.code`.

## 10. Things that bypass the rules (avoid)

- Raw SQL or admin tools that update `stock_counter`, `free_stock_seqs` or `stocks.seq`. The triggers block most of this, but treat these tables as private to the allocator.
- Bulk imports with fixed `seq` values: the trigger overwrites them. A real import needs the assign trigger temporarily disabled and the counter adjusted by hand.
- Disabling triggers in application code or in production "just to fix something".
- `TRUNCATE`: blocked on purpose. In tests, disable the specific `*_no_truncate` trigger explicitly if you need it.

## Quick checklist for code review

- [ ] No `id` or `seq` in insert values.
- [ ] No `onConflictDo*` on `stocks`; upserts use `add_stock_quantity`.
- [ ] Quantity changes use relative SQL (`quantity + delta`), not read-modify-write.
- [ ] Updates only touch `quantity` / `storageLocation`.
- [ ] `isNull` used for null `procurementId`.
- [ ] `seq` converted to string before JSON serialization.
- [ ] Child tables reference `stocks.id` (`text`), have an FK index, and use the intended `onDelete`.
- [ ] Deletion code purges caches and external references holding the id.
- [ ] Transactions that insert into `stocks` are short.

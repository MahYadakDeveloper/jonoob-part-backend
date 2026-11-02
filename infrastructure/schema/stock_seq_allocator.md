# `0001_stock_seq_allocator.sql` — Guide and Key Notes

> This file has not been executed against a real PostgreSQL instance. Test it on a throwaway database first. Requires PostgreSQL 15+.

## What it does

Gives every row in `warehouse.stocks` a number `seq` (and therefore a label `id` = `S` + zero-padded `seq`) with these guarantees:

1. **Phase 1:** fresh numbers `1..max_seq` come from a single-row counter table.
2. **Phase 2:** once the counter reaches `max_seq`, the smallest number in `warehouse.free_stock_seqs` (numbers released by deleted stocks) is reused.
3. **No gaps:** a rolled-back insert returns its number automatically, because the counter update lives inside the inserting transaction.

## Prerequisites (created by the drizzle-generated migration, not by this file)

- `warehouse.stocks` with `seq bigint` primary key (`DEFAULT NULL`), generated `id`, `product_id`, `procurement_id`, `quantity`, `storage_location`
- `warehouse.stock_counter` (`singleton`, `last_seq`, `max_seq`)
- `warehouse.free_stock_seqs` (`seq` primary key, `freed_at`)

This migration must run **after** the one that creates those tables.

## How to add it to the project

```bash
drizzle-kit generate                                        # tables (from schema.ts)
drizzle-kit generate --custom --name=stock_seq_allocator    # empty custom migration
# paste the full content of 0001_stock_seq_allocator.sql into the new file
drizzle-kit migrate
```

- Keep every `--> statement-breakpoint` marker; the drizzle migrator splits statements on them.
- Do not edit the file after it has been applied. Put later changes in a new migration.
- drizzle-kit does not track functions or triggers: it will never create, drop or warn about them.

## What the file contains

| Object | Purpose |
|---|---|
| Seed `INSERT` into `stock_counter` | Creates the single counter row (`last_seq = 0`, `max_seq = 999999999999`). Idempotent via `ON CONFLICT DO NOTHING`. |
| `next_stock_seq()` | The allocator (details below). |
| `stocks_assign_seq` (BEFORE INSERT) | Sets `NEW.seq := next_stock_seq()`, overriding any supplied value. |
| `stocks_release_seq` (AFTER DELETE) | Inserts `OLD.seq` into `free_stock_seqs`. No `ON CONFLICT`: a duplicate means corruption and must fail loudly. |
| `stocks_seq_immutable` | Blocks `UPDATE` of `seq`. |
| `stocks_identity_immutable` | Blocks `UPDATE` of `product_id` and `procurement_id`. |
| `stock_counter_guard_update` / `_delete` | `last_seq` may only stay the same or advance by exactly 1; `singleton` is immutable; the row cannot be deleted. Changing `max_seq` alone is allowed. |
| `*_no_truncate` (3 triggers) | Block `TRUNCATE` on `stocks`, `free_stock_seqs`, `stock_counter` (TRUNCATE skips row triggers and would lose or desync numbers). |
| `add_stock_quantity(...)` | Gap-free upsert; returns the stock label (`text`). |

## How `next_stock_seq()` works

1. `SELECT ... FROM stock_counter FOR UPDATE` takes the counter row lock. This serializes **all** allocations until commit or rollback.
2. If `last_seq < max_seq`: increment `last_seq`, return the new value (phase 1).
3. Otherwise delete and return the smallest `seq` from `free_stock_seqs` (phase 2).
4. If the pool is empty: raise `program_limit_exceeded` ("stock seq space exhausted").

Because allocators are serialized by the counter lock, the pool is never contended by another allocator, so `SKIP LOCKED` is unnecessary and there are no false "exhausted" errors.

## Key notes

### 1. Never use `ON CONFLICT` on `stocks`
The `BEFORE INSERT` trigger runs before conflict detection. If the statement then inserts nothing (`DO NOTHING`, or `DO UPDATE` taking the update path), the counter increment is **not** rolled back and a permanent gap appears. This also applies to Drizzle's `.onConflictDoNothing()` / `.onConflictDoUpdate()`.

Use the function instead (its `EXCEPTION` block is a savepoint, so a failed insert also rolls back the counter):

```ts
await db.execute(sql`
  SELECT warehouse.add_stock_quantity(
    ${productId}::uuid, ${procurementId}::uuid, ${delta}::integer, ${location}::text
  ) AS id
`);
// node-postgres: result.rows[0].id   |   postgres-js: result[0].id
```

A plain `INSERT` that fails (e.g. unique violation) is safe: the error aborts the transaction, which rolls the counter back.

### 2. Inserts are serialized
The counter row lock is held until the inserting transaction ends. Keep transactions that insert into `stocks` short; no network calls or heavy work in the middle.

### 3. A supplied `seq` is ignored
The trigger overwrites it. For data imports with fixed numbers you must temporarily disable `stocks_assign_seq` and keep `stock_counter` consistent yourself.

### 4. Raising the ceiling
```sql
UPDATE warehouse.stock_counter SET max_seq = 9999999999999;
```
Must be `>= last_seq` (table check). Phase 1 resumes from where it stopped. Never edit `last_seq` by hand. The label format supports up to 19 digits (`bigint` limit).

### 5. Recycled labels
In phase 2 a label can point to a different stock than before. Foreign keys to `stocks.id` protect database rows (a stock cannot be deleted while a `restrict` child references it), but references **outside** foreign keys (caches, events, logs, printed labels, external systems) are not protected. Purge or invalidate them when a stock is deleted. No cooldown on freed numbers is implemented: the smallest free number is reused immediately.

### 6. `TRUNCATE` is blocked
In tests, temporarily disable the relevant trigger (`ALTER TABLE ... DISABLE TRIGGER ...`) if you must truncate.

### 7. Moving a stock
`product_id` / `procurement_id` cannot be updated. "Moving" means `DELETE` + `INSERT` (new label), and only works while no child row references the stock.

### 8. Do not change the `id` generated expression later
drizzle-kit would drop and recreate the column, which fails when child tables hold foreign keys to it.

### 9. Existing data
This file assumes an empty database. With existing rows you need a separate data migration: set `last_seq` to `max(seq)`, insert unused numbers in `1..last_seq` into `free_stock_seqs`, and drop the old sequence. Disable the `stock_counter_guard_update` trigger for that step, otherwise the guard rejects the jump.

## Behavior checklist for manual testing

- Sequential inserts yield `S000000000001`, `S000000000002`, ...
- Insert inside a transaction + rollback, then insert again: the same number is reused.
- Duplicate (product, procurement) insert fails and burns no number.
- `UPDATE` of `seq`, `product_id` or `procurement_id` fails.
- `TRUNCATE` on the three tables fails.
- Set `max_seq = last_seq`, delete a stock, insert a new one: it receives the freed number. With an empty pool the insert fails with "stock seq space exhausted".

# `stock_seq_allocator` migration — Guide and Key Notes

> Smoke-tested on PGlite (PostgreSQL 18). Requires PostgreSQL 15+ (`NULLS NOT DISTINCT`). Verify on a throwaway database of your target version before production.

## What it does

Gives every row in `warehouse.labels` a number `seq` (and therefore a label `id` = `S` + zero-padded `seq`) with these guarantees:

1. **Phase 1:** fresh numbers `1..max_seq` come from the single-row `warehouse.label_counter`.
2. **Phase 2:** once the counter reaches `max_seq`, the smallest number in `warehouse.free_label_seqs` (numbers released by deleted labels) is reused.
3. **No gaps:** a rolled-back insert returns its number, because the counter update lives inside the inserting transaction.

`warehouse.stocks` holds the quantity held under one label. It has no `product_id`: the product is `labels.product_id`. Stock and label are **one-to-one**: `stocks.label_id` is `NOT NULL` and `UNIQUE`, so a stock cannot exist without a label and a label has at most one stock. A label may or may not come from a procurement (`labels.procurement_id` is nullable). The stock's identity is a random `uuid`, not the label.

## Prerequisites (created by the drizzle-generated migration, not by this file)

- `warehouse.labels` (`seq` PK with `DEFAULT NULL`, generated unique `id`, `product_id`, `procurement_id`, `created_at`)
- `warehouse.label_counter` (`singleton`, `last_seq`, `max_seq`)
- `warehouse.free_label_seqs` (`seq` PK, `freed_at`)
- `warehouse.stocks`

This migration must run **after** the one that creates those tables. Migrations run in folder-name (timestamp) order, so generate the tables migration first, then the custom one:

```bash
drizzle-kit generate                                        # tables (from *.schema.ts)
drizzle-kit generate --custom --name=stock_seq_allocator    # empty custom migration
# paste the content of migration.sql into the new file
drizzle-kit migrate
```

- Keep every `--> statement-breakpoint` marker; the drizzle migrator splits statements on them.
- Do not edit the file after it has been applied. Put later changes in a new migration.
- drizzle-kit does not track functions or triggers: it will never create, drop or warn about them.

## What the file contains

| Object | Purpose |
|---|---|
| Seed `INSERT` into `label_counter` | Creates the single counter row (`last_seq = 0`, `max_seq = 999999999999`). Idempotent. |
| `next_label_seq()` | The allocator (details below). |
| `labels_assign_seq` (BEFORE INSERT) | Sets `NEW.seq := next_label_seq()`, overriding any supplied value. |
| `labels_release_seq` (AFTER DELETE) | Inserts `OLD.seq` into `free_label_seqs`. No `ON CONFLICT`: a duplicate means corruption and must fail loudly. |
| `labels_seq_immutable` | Blocks `UPDATE` of `seq`. |
| `labels_identity_immutable` | Blocks `UPDATE` of `product_id` and `procurement_id`. |
| `stocks_identity_immutable` | Blocks `UPDATE` of `label_id`. |
| `stocks_track_zeroed` | Maintains `zeroed_at` (set when `quantity` becomes 0, kept while it stays 0, cleared otherwise). The purge job's grace period is based on it. |
| `label_counter_guard_update` / `_delete` | `last_seq` may only stay the same or advance by exactly 1; `singleton` is immutable; the row cannot be deleted. Changing `max_seq` alone is allowed. |
| `*_no_truncate` (3 triggers) | Block `TRUNCATE` on `labels`, `free_label_seqs`, `label_counter`. |
| `add_stock_quantity(label_id, delta, storage_location)` | Gap-free upsert of the stock of a label (the product comes from the label); returns `stocks.id` (`uuid`). |

## How `next_label_seq()` works

1. `SELECT ... FOR UPDATE` takes the counter row lock. This serializes **all** allocations until commit or rollback.
2. If `last_seq < max_seq`: increment `last_seq`, return the new value (phase 1).
3. Otherwise delete and return the smallest `seq` from `free_label_seqs` (phase 2).
4. If the pool is empty: raise `program_limit_exceeded` ("label seq space exhausted").

Because allocators are serialized by the counter lock, the pool is never contended by another allocator, so `SKIP LOCKED` is unnecessary. Numbers released by a purge transaction that has not committed yet are invisible to the allocator; this only matters after the ceiling is reached.

## Key notes

### 1. Never use `ON CONFLICT` on `labels`
The `BEFORE INSERT` trigger runs before conflict detection. If the statement then inserts nothing, the counter increment is **not** rolled back and a permanent gap appears. This also applies to Drizzle's `.onConflictDoNothing()` / `.onConflictDoUpdate()`.

### 2. Never use `ON CONFLICT` for stock upserts either
Postgres checks `CHECK` constraints on the proposed row before conflict detection, so a negative delta fails on `quantity >= 0` even though the existing row could absorb it. Use `warehouse.add_stock_quantity(...)` (see `stock_code_usage_rules.md`). It relies on `READ COMMITTED`; under stricter isolation it raises `serialization_failure` after a few attempts instead of looping.

### 3. Inserts into `labels` are serialized
The counter row lock is held until the inserting transaction ends. Keep transactions that create new labels short.

### 4. A supplied `seq` is ignored
The trigger overwrites it. For data imports with fixed numbers you must temporarily disable `labels_assign_seq` and keep `label_counter` consistent yourself.

### 5. Raising the ceiling
```sql
UPDATE warehouse.label_counter SET max_seq = 9999999999999;
```
Must be `>= last_seq` (table check). Phase 1 resumes where it stopped. Never edit `last_seq` by hand. The label format supports up to 19 digits (`bigint` limit).

### 6. Recycled labels
In phase 2 a label number can point to a different label than before. Foreign keys to `labels.id` protect database rows (a label cannot be deleted while a child references it), but references **outside** foreign keys (caches, events, logs, printed labels, POS) are not protected. Purge or invalidate them when a label is deleted. No cooldown on freed numbers is implemented.

### 7. `TRUNCATE` is blocked
In tests, temporarily disable the relevant trigger (`ALTER TABLE ... DISABLE TRIGGER ...`) if you must truncate.

### 8. "Moving" a label
`product_id` / `procurement_id` cannot be updated. "Moving" means `DELETE` + `INSERT` (new number), and only works while no child row references the label.

### 9. Do not change the `id` generated expression later
drizzle-kit would drop and recreate the column, which fails when child tables hold foreign keys to it.

### 10. Existing data
This file assumes an empty database. With existing rows you need a separate data migration: set `last_seq` to `max(seq)`, insert unused numbers in `1..last_seq` into `free_label_seqs`. Disable `label_counter_guard_update` for that step, otherwise the guard rejects the jump.

## Behavior checklist for manual testing

- Sequential label inserts yield `S000000000001`, `S000000000002`, ...
- Insert inside a transaction + rollback, then insert again: the same number is reused.
- A stock without a label, or a second stock for the same label, fails (`23502` / `stocks_label_id_uq`).
- A stock or `add_stock_quantity` call for a label that does not exist fails with a foreign key violation.
- `UPDATE` of `labels.seq`, `labels.product_id` or `stocks.label_id` fails.
- `TRUNCATE` on the three allocator tables fails.
- Set `max_seq = last_seq`, delete a label, insert a new one: it receives the freed number. With an empty pool the insert fails with "label seq space exhausted".

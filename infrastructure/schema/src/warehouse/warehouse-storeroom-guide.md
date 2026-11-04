# Warehouses, Storeroom and Shelves

Design decisions, final schema, admin endpoints and sample code for the warehouse side of the system.
The `stocks` table has its own document: see [`stocks-guide.md`](./stocks-guide.md).

## 1. Design decisions

| Topic                                               | Decision                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| What is the storeroom?                              | The shop's own warehouse. A **regular row** in `warehouses` with `code = STOREROOM_CODE` |
| `warehouse_id` in `shelves` and `stocks`            | `NOT NULL`. A NULL warehouse does **not** mean storeroom                                 |
| Shelves in the storeroom                            | Allowed, exactly like any other warehouse                                                |
| Creating the storeroom                              | At runtime through a dedicated admin endpoint. Not a migration, not a seed               |
| Calling the create-storeroom endpoint again         | Fails with `409 STOREROOM_ALREADY_EXISTS`                                                |
| Creating a normal warehouse with `code = storeroom` | Rejected (`422 RESERVED_WAREHOUSE_CODE`)                                                 |
| Deleting the storeroom                              | Forbidden                                                                                |
| Editing `code`                                      | Never. Only `name` and `address` are editable, for every warehouse                       |
| Deleting a warehouse                                | Only when no shelf and no stock row points to it                                         |

### Why not `NULL` for the storeroom?

The composite FK `(shelf_id, warehouse_id)` is `MATCH SIMPLE` in Postgres: if **any** column of the key is NULL the FK is not checked at all. With a nullable `warehouse_id`, a stock row could point at a shelf of another warehouse and nothing would notice. Keeping `warehouse_id` mandatory means the "shelf belongs to the same warehouse" guarantee is always enforced, with no helper column and no trigger.

---

## 2. Schema

```ts
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  smallint,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
// import { warehouseSchema } from '...';

export const STOREROOM_CODE = 'storeroom';

// ───────── warehouses ─────────
// The shop's own storage is a regular row with code STOREROOM_CODE.
// It is created at runtime by an admin endpoint (see section 4).
export const warehouses = warehouseSchema.table('warehouses', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  address: text('address'),
});

// ───────── shelves ─────────
export const shelves = warehouseSchema.table(
  'shelves',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'restrict' }),

    aisle: smallint('aisle').notNull(),
    bay: smallint('bay').notNull(),
    // 0 = ground floor, counted upwards
    level: smallint('level').notNull(),

    // Derived from the coordinates, so it can never drift from them.
    // Fixed width keeps text ordering equal to physical ordering: 02-014-3
    code: text('code')
      .notNull()
      .generatedAlwaysAs(
        sql`lpad(aisle::text, 2, '0') || '-' || lpad(bay::text, 3, '0') || '-' || level::text`,
      ),

    active: boolean('active').notNull().default(true),
  },
  (t) => [
    unique('shelves_position_uq').on(t.warehouseId, t.aisle, t.bay, t.level),
    // Lookup by scanned code.
    unique('shelves_warehouse_code_uq').on(t.warehouseId, t.code),
    // Target of the composite FK from stocks.
    unique('shelves_id_warehouse_uq').on(t.id, t.warehouseId),
    check('shelves_aisle_chk', sql`${t.aisle} BETWEEN 1 AND 99`),
    check('shelves_bay_chk', sql`${t.bay} BETWEEN 1 AND 999`),
    check('shelves_level_chk', sql`${t.level} BETWEEN 0 AND 9`),
  ],
);
```

The `stocks` table (quantity per product and place) is documented in `stocks-guide.md`.

### Database behavior: error or silent?

| Operation                                               | Result                                                 | Enforced by                                                      |
| ------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| Delete a warehouse that still has shelves               | Error (`23503`)                                        | `onDelete: 'restrict'` on `shelves.warehouse_id`                 |
| Delete a warehouse that still has stock rows            | Error (`23503`)                                        | `onDelete: 'restrict'` on `stocks.warehouse_id`                  |
| Delete a shelf that still has stock rows                | Error (`23503`)                                        | composite FK from `stocks` with `restrict`                       |
| Stock row pointing at a shelf of another warehouse      | Error (`23503`)                                        | composite FK `(shelf_id, warehouse_id)`                          |
| Two warehouses with the same `code`                     | Error (`23505`)                                        | `unique` on `warehouses.code`                                    |
| Two shelves at the same position in one warehouse       | Error (`23505`)                                        | `shelves_position_uq`                                            |
| Delete or change the code of the storeroom with raw SQL | **Silent**                                             | only the service layer guards it (optional trigger in section 8) |
| Change `aisle/bay/level` of a shelf                     | Silent; `code` changes and stock rows follow the shelf | by design                                                        |
| Stock a shelf that has `active = false`                 | **Silent**                                             | nothing checks it                                                |

Because stock rows are deleted the moment their quantity reaches zero, an emptied shelf or warehouse is deletable immediately. There are no leftover zero rows blocking the `restrict` FKs.

---

## 3. Endpoints

All routes sit behind the admin guard (`AdminGuard` in the sample code; replace it with the project's real guard).

| Method   | Path                          | Purpose                     | Success | Errors                                                      |
| -------- | ----------------------------- | --------------------------- | ------- | ----------------------------------------------------------- |
| `POST`   | `/admin/warehouses/storeroom` | Create the storeroom (once) | `201`   | `409 STOREROOM_ALREADY_EXISTS`                              |
| `POST`   | `/admin/warehouses`           | Create a normal warehouse   | `201`   | `409 WAREHOUSE_CODE_TAKEN`, `422 RESERVED_WAREHOUSE_CODE`   |
| `GET`    | `/admin/warehouses`           | List warehouses             | `200`   | none                                                        |
| `GET`    | `/admin/warehouses/:id`       | Get one warehouse           | `200`   | `404 WAREHOUSE_NOT_FOUND`                                   |
| `PATCH`  | `/admin/warehouses/:id`       | Rename / change address     | `200`   | `404 WAREHOUSE_NOT_FOUND`                                   |
| `DELETE` | `/admin/warehouses/:id`       | Delete a warehouse          | `204`   | `404`, `409 STOREROOM_PROTECTED`, `409 WAREHOUSE_NOT_EMPTY` |

### Race-safe creation

Do not "check if it exists, then insert": two simultaneous requests would both pass the check. Use
`INSERT ... ON CONFLICT (code) DO NOTHING RETURNING *` and treat an empty result as "already exists". The final guarantee is the `unique` constraint, not the application code.

### Before the storeroom exists

Any feature that needs the storeroom (for example receiving goods) must call `getStoreroomIdOrThrow()`, which fails with `409 STOREROOM_NOT_INITIALIZED` when the row is missing. The storeroom cannot be deleted, so its `id` can be cached in memory after the first successful lookup. Cache only the positive result, never "not found".

---

## 4. Sample code

> The code is intentionally standalone. Adapt it to your `DrizzleBaseRepository`, transaction handling (`DrizzleTransactionAls`) and errors module.

### Errors

```ts
// warehouse.errors.ts
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

export class StoreroomAlreadyExistsError extends ConflictException {
  constructor() {
    super({
      key: 'STOREROOM_ALREADY_EXISTS',
      message: 'Storeroom already exists',
    });
  }
}
export class StoreroomNotInitializedError extends ConflictException {
  constructor() {
    super({
      key: 'STOREROOM_NOT_INITIALIZED',
      message: 'Storeroom has not been created yet',
    });
  }
}
export class StoreroomProtectedError extends ConflictException {
  constructor() {
    super({
      key: 'STOREROOM_PROTECTED',
      message: 'Storeroom cannot be deleted',
    });
  }
}
export class WarehouseCodeTakenError extends ConflictException {
  constructor() {
    super({
      key: 'WAREHOUSE_CODE_TAKEN',
      message: 'Warehouse code is already in use',
    });
  }
}
export class WarehouseNotEmptyError extends ConflictException {
  constructor() {
    super({
      key: 'WAREHOUSE_NOT_EMPTY',
      message: 'Warehouse still has shelves or stock',
    });
  }
}
export class ReservedWarehouseCodeError extends UnprocessableEntityException {
  constructor() {
    super({
      key: 'RESERVED_WAREHOUSE_CODE',
      message: 'This code is reserved for the storeroom',
    });
  }
}
export class WarehouseNotFoundError extends NotFoundException {
  constructor() {
    super({ key: 'WAREHOUSE_NOT_FOUND', message: 'Warehouse not found' });
  }
}
```

### Detecting Postgres errors

Depending on the Drizzle version, the driver error may be wrapped and live under `cause`. Handle both:

```ts
// pg-error.ts
export function pgCode(e: unknown): string | undefined {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code ?? err?.cause?.code;
}
export const isFkViolation = (e: unknown) => pgCode(e) === '23503';
export const isUniqueViolation = (e: unknown) => pgCode(e) === '23505';
```

### Repository

```ts
// warehouse.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { warehouses } from './warehouse.schema';
// import { DB, Db } from '...';

export type Warehouse = typeof warehouses.$inferSelect;

@Injectable()
export class WarehouseRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Returns null when the code already exists. */
  async insert(values: {
    code: string;
    name: string;
    address?: string | null;
  }): Promise<Warehouse | null> {
    const [row] = await this.db
      .insert(warehouses)
      .values(values)
      .onConflictDoNothing({ target: warehouses.code })
      .returning();
    return row ?? null;
  }

  async findById(id: string): Promise<Warehouse | null> {
    const [row] = await this.db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id));
    return row ?? null;
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    const [row] = await this.db
      .select()
      .from(warehouses)
      .where(eq(warehouses.code, code));
    return row ?? null;
  }

  list(): Promise<Warehouse[]> {
    return this.db.select().from(warehouses).orderBy(warehouses.name);
  }

  async update(
    id: string,
    patch: { name?: string; address?: string | null },
  ): Promise<Warehouse | null> {
    const [row] = await this.db
      .update(warehouses)
      .set(patch)
      .where(eq(warehouses.id, id))
      .returning();
    return row ?? null;
  }

  /** Throws a Postgres FK error (23503) if shelves or stock rows still reference it. */
  async delete(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(warehouses)
      .where(eq(warehouses.id, id))
      .returning({ id: warehouses.id });
    return rows.length > 0;
  }
}
```

### Service

```ts
// warehouse.service.ts
import { Injectable } from '@nestjs/common';
import { STOREROOM_CODE } from './warehouse.schema';
import { isFkViolation } from './pg-error';
import { WarehouseRepository, Warehouse } from './warehouse.repository';
import {
  ReservedWarehouseCodeError,
  StoreroomAlreadyExistsError,
  StoreroomNotInitializedError,
  StoreroomProtectedError,
  WarehouseCodeTakenError,
  WarehouseNotEmptyError,
  WarehouseNotFoundError,
} from './warehouse.errors';

@Injectable()
export class WarehouseService {
  private storeroomId: string | null = null; // cache the positive result only

  constructor(private readonly repo: WarehouseRepository) {}

  async createStoreroom(input: {
    name?: string;
    address?: string | null;
  }): Promise<Warehouse> {
    const row = await this.repo.insert({
      code: STOREROOM_CODE,
      name: input.name ?? 'Storeroom',
      address: input.address ?? null,
    });
    if (!row) throw new StoreroomAlreadyExistsError();
    this.storeroomId = row.id;
    return row;
  }

  async create(input: {
    code: string;
    name: string;
    address?: string | null;
  }): Promise<Warehouse> {
    if (input.code === STOREROOM_CODE) throw new ReservedWarehouseCodeError();
    const row = await this.repo.insert(input);
    if (!row) throw new WarehouseCodeTakenError();
    return row;
  }

  list() {
    return this.repo.list();
  }

  async get(id: string): Promise<Warehouse> {
    const row = await this.repo.findById(id);
    if (!row) throw new WarehouseNotFoundError();
    return row;
  }

  async update(
    id: string,
    patch: { name?: string; address?: string | null },
  ): Promise<Warehouse> {
    const row = await this.repo.update(id, patch);
    if (!row) throw new WarehouseNotFoundError();
    return row;
  }

  async remove(id: string): Promise<void> {
    const row = await this.repo.findById(id);
    if (!row) throw new WarehouseNotFoundError();
    if (row.code === STOREROOM_CODE) throw new StoreroomProtectedError();

    try {
      const deleted = await this.repo.delete(id);
      if (!deleted) throw new WarehouseNotFoundError(); // deleted concurrently
    } catch (e) {
      if (isFkViolation(e)) throw new WarehouseNotEmptyError();
      throw e;
    }
  }

  /** For other features (e.g. receiving goods into the shop's own storage). */
  async getStoreroomIdOrThrow(): Promise<string> {
    if (this.storeroomId) return this.storeroomId;
    const row = await this.repo.findByCode(STOREROOM_CODE);
    if (!row) throw new StoreroomNotInitializedError();
    this.storeroomId = row.id;
    return row.id;
  }
}
```

### Controller

```ts
// admin-warehouses.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
// import { AdminGuard } from '...';
import { WarehouseService } from './warehouse.service';

// Validate these with your usual pipe (class-validator / zod).
// code: non-empty lowercase slug; name: non-empty; address: optional.
type CreateStoreroomDto = { name?: string; address?: string | null };
type CreateWarehouseDto = {
  code: string;
  name: string;
  address?: string | null;
};
type UpdateWarehouseDto = { name?: string; address?: string | null };

@Controller('admin/warehouses')
@UseGuards(AdminGuard)
export class AdminWarehousesController {
  constructor(private readonly service: WarehouseService) {}

  // Second call -> 409 STOREROOM_ALREADY_EXISTS.
  @Post('storeroom')
  createStoreroom(@Body() dto: CreateStoreroomDto) {
    return this.service.createStoreroom(dto);
  }

  @Post()
  create(@Body() dto: CreateWarehouseDto) {
    return this.service.create(dto);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.service.update(id, dto); // code is intentionally not editable
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
```

---

## 5. Migrations

The database is still empty, so just generate and apply:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

- **No seed migration.** The storeroom row is created by the endpoint.
- `NULLS NOT DISTINCT` (used by `stocks`) needs PostgreSQL **15+**.
- The stocks trigger lives in a custom migration; see `stocks-guide.md` for the exact steps. Run `generate` for the tables first, then the `--custom` one, so the trigger file sorts after the table migration.
- After generating, open the SQL once and check that `GENERATED ALWAYS AS (...) STORED` and `NULLS NOT DISTINCT` were emitted correctly.

---

## 6. Manual tests

```bash
# Create the storeroom (first call: 201)
curl -X POST http://localhost:3000/admin/warehouses/storeroom \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Storeroom"}'

# Second call -> 409 STOREROOM_ALREADY_EXISTS
curl -i -X POST http://localhost:3000/admin/warehouses/storeroom \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Reserved code -> 422 RESERVED_WAREHOUSE_CODE
curl -i -X POST http://localhost:3000/admin/warehouses \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"code":"storeroom","name":"x"}'

# Delete the storeroom -> 409 STOREROOM_PROTECTED
curl -i -X DELETE http://localhost:3000/admin/warehouses/$STOREROOM_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Suggested automated tests:

1. Two concurrent `POST /storeroom` requests: one `201`, one `409`.
2. Delete a warehouse that has a shelf: `409 WAREHOUSE_NOT_EMPTY`.
3. Delete a warehouse that has a stock row: `409 WAREHOUSE_NOT_EMPTY`.
4. Empty the only stock row of a warehouse (quantity to 0, row auto-deleted), then delete the warehouse: `204`.
5. Delete an empty warehouse: `204`, then `GET` returns `404`.
6. `PATCH` with a `code` in the body must be ignored or rejected by validation.

---

## 7. Operational notes

- **Deleting a warehouse that has shelves.** `shelves -> warehouses` is `restrict`, so shelves must be deleted first. If you want "delete warehouse" to also remove its empty shelves, do that inside one transaction in the service.
- **`warehouses` has no `active` column**, so deactivating a warehouse is not a concept. If it comes back later, add a trigger that rejects stocking into an inactive warehouse.
- **Shelves still have `active`**, and nothing stops stocking an inactive shelf. If that matters, add a `BEFORE INSERT OR UPDATE OF shelf_id` trigger on `stocks` that rejects inactive shelves.
- **Storeroom shelves.** Shelf-management endpoints are out of scope here, but because the storeroom is a normal warehouse the same endpoints work for it.

---

## 8. Optional: protect the storeroom in the database

The service layer blocks deleting the storeroom and changing its code, but raw SQL or a bug can bypass it. To enforce it in the database, add this in a custom migration (replace the schema name with your real one):

```sql
CREATE FUNCTION warehouse.protect_storeroom() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.code = 'storeroom' THEN
      RAISE EXCEPTION 'storeroom cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE OF code
  IF NEW.code IS DISTINCT FROM OLD.code
     AND (OLD.code = 'storeroom' OR NEW.code = 'storeroom') THEN
    RAISE EXCEPTION 'storeroom code is immutable and reserved';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER warehouses_protect_storeroom
BEFORE DELETE OR UPDATE OF code ON warehouse.warehouses
FOR EACH ROW EXECUTE FUNCTION warehouse.protect_storeroom();
```

---

## 9. Checklist

- [ ] `STOREROOM_CODE` is defined once and imported everywhere
- [ ] `warehouses` has only `id, code, name, address`
- [ ] The create-storeroom endpoint returns `409` on the second call
- [ ] Creating a normal warehouse with `code = storeroom` is rejected
- [ ] Deleting the storeroom is blocked in the service
- [ ] Postgres `23503` is mapped to `WAREHOUSE_NOT_EMPTY`
- [ ] Features that need the storeroom call `getStoreroomIdOrThrow()`
- [ ] The `stocks_delete_when_empty` trigger exists (custom migration, see `stocks-guide.md`)
- [ ] PostgreSQL 15 or newer

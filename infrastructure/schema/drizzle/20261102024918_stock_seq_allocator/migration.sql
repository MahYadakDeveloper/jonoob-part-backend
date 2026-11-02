-- 0001_stock_seq_allocator.sql
-- Custom migration:  drizzle-kit generate --custom --name=stock_seq_allocator
-- drizzle-kit does not manage functions/triggers, so keep this file by hand.
--
-- Allocation policy
--   Phase 1: fresh numbers 1..max_seq from the single-row counter.
--   Phase 2: once last_seq = max_seq, reuse the smallest number in free_stock_seqs.
--   Both phases run inside the inserting transaction, so a rollback gives the
--   number back automatically (no gaps).
--
-- Concurrency
--   next_stock_seq() first takes a row lock on stock_counter, which serializes
--   every allocation until commit/rollback. Consequently the free pool is never
--   contended by another allocator, SKIP LOCKED is not needed and there are no
--   false "exhausted" errors.

-- ---------------------------------------------------------------------------
-- Seed the counter (ceiling = 12 digits; raising it later is allowed).
-- ---------------------------------------------------------------------------
INSERT INTO warehouse.stock_counter (singleton, last_seq, max_seq)
VALUES (true, 0, 999999999999)
ON CONFLICT (singleton) DO NOTHING;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Allocator
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION warehouse.next_stock_seq()
RETURNS bigint
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_last bigint;
  v_max  bigint;
  v_seq  bigint;
BEGIN
  SELECT last_seq, max_seq
    INTO v_last, v_max
    FROM warehouse.stock_counter
   WHERE singleton
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'warehouse.stock_counter row is missing';
  END IF;

  -- Phase 1: fresh number
  IF v_last < v_max THEN
    UPDATE warehouse.stock_counter
       SET last_seq = v_last + 1
     WHERE singleton;
    RETURN v_last + 1;
  END IF;

  -- Phase 2: ceiling reached, reuse the smallest freed number
  DELETE FROM warehouse.free_stock_seqs
   WHERE seq = (
     SELECT seq
       FROM warehouse.free_stock_seqs
      ORDER BY seq
      LIMIT 1
      FOR UPDATE
   )
  RETURNING seq INTO v_seq;

  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'stock seq space exhausted (max_seq = %)', v_max
      USING ERRCODE = 'program_limit_exceeded';
  END IF;

  RETURN v_seq;
END;
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- stocks: assign seq on insert (overrides any supplied value)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION warehouse.assign_stock_seq()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.seq := warehouse.next_stock_seq();
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS stocks_assign_seq ON warehouse.stocks;
--> statement-breakpoint

CREATE TRIGGER stocks_assign_seq
  BEFORE INSERT ON warehouse.stocks
  FOR EACH ROW
  EXECUTE FUNCTION warehouse.assign_stock_seq();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- stocks: release seq on delete (no ON CONFLICT on purpose: a duplicate means
-- corruption and must fail loudly)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION warehouse.release_stock_seq()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO warehouse.free_stock_seqs (seq) VALUES (OLD.seq);
  RETURN OLD;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS stocks_release_seq ON warehouse.stocks;
--> statement-breakpoint

CREATE TRIGGER stocks_release_seq
  AFTER DELETE ON warehouse.stocks
  FOR EACH ROW
  EXECUTE FUNCTION warehouse.release_stock_seq();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- stocks.seq is immutable after insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION warehouse.forbid_stock_seq_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.seq IS DISTINCT FROM OLD.seq THEN
    RAISE EXCEPTION 'warehouse.stocks.seq is immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS stocks_seq_immutable ON warehouse.stocks;
--> statement-breakpoint

CREATE TRIGGER stocks_seq_immutable
  BEFORE UPDATE OF seq ON warehouse.stocks
  FOR EACH ROW
  EXECUTE FUNCTION warehouse.forbid_stock_seq_change();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- stock_counter: it may only advance by exactly one (via next_stock_seq),
-- and the row can never be deleted. Changing max_seq alone is allowed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION warehouse.guard_stock_counter()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'warehouse.stock_counter row cannot be deleted';
  END IF;

  IF NEW.singleton IS DISTINCT FROM OLD.singleton THEN
    RAISE EXCEPTION 'warehouse.stock_counter.singleton is immutable';
  END IF;

  IF NEW.last_seq <> OLD.last_seq AND NEW.last_seq <> OLD.last_seq + 1 THEN
    RAISE EXCEPTION
      'warehouse.stock_counter.last_seq may only advance by one (old %, new %)',
      OLD.last_seq, NEW.last_seq;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS stock_counter_guard_update ON warehouse.stock_counter;
--> statement-breakpoint

CREATE TRIGGER stock_counter_guard_update
  BEFORE UPDATE ON warehouse.stock_counter
  FOR EACH ROW
  EXECUTE FUNCTION warehouse.guard_stock_counter();
--> statement-breakpoint

DROP TRIGGER IF EXISTS stock_counter_guard_delete ON warehouse.stock_counter;
--> statement-breakpoint

CREATE TRIGGER stock_counter_guard_delete
  BEFORE DELETE ON warehouse.stock_counter
  FOR EACH ROW
  EXECUTE FUNCTION warehouse.guard_stock_counter();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- TRUNCATE does not fire row triggers: it would lose freed numbers (gaps) or
-- desynchronize the counter. Block it. In tests, disable these triggers
-- explicitly (ALTER TABLE ... DISABLE TRIGGER ...) if you need to truncate.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION warehouse.forbid_truncate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'TRUNCATE is forbidden on %.%', TG_TABLE_SCHEMA, TG_TABLE_NAME;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS stocks_no_truncate ON warehouse.stocks;
--> statement-breakpoint
CREATE TRIGGER stocks_no_truncate
  BEFORE TRUNCATE ON warehouse.stocks
  FOR EACH STATEMENT EXECUTE FUNCTION warehouse.forbid_truncate();
--> statement-breakpoint

DROP TRIGGER IF EXISTS free_stock_seqs_no_truncate ON warehouse.free_stock_seqs;
--> statement-breakpoint
CREATE TRIGGER free_stock_seqs_no_truncate
  BEFORE TRUNCATE ON warehouse.free_stock_seqs
  FOR EACH STATEMENT EXECUTE FUNCTION warehouse.forbid_truncate();
--> statement-breakpoint

DROP TRIGGER IF EXISTS stock_counter_no_truncate ON warehouse.stock_counter;
--> statement-breakpoint
CREATE TRIGGER stock_counter_no_truncate
  BEFORE TRUNCATE ON warehouse.stock_counter
  FOR EACH STATEMENT EXECUTE FUNCTION warehouse.forbid_truncate();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Gap-free upsert. Returns the stock label (stocks.id).
--
-- Do NOT use INSERT ... ON CONFLICT (or Drizzle onConflictDo*) on stocks:
-- the BEFORE INSERT trigger runs before conflict detection, and when the
-- statement then does NOT insert, the counter increment is NOT rolled back,
-- which leaves a gap. The EXCEPTION block below is a savepoint, so a failed
-- insert rolls the counter back too.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION warehouse.add_stock_quantity(
  p_product_id       uuid,
  p_procurement_id   uuid,
  p_delta            integer,
  p_storage_location text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_id text;
BEGIN
  LOOP
    UPDATE warehouse.stocks
       SET quantity = quantity + p_delta
     WHERE product_id = p_product_id
       AND procurement_id IS NOT DISTINCT FROM p_procurement_id
    RETURNING id INTO v_id;

    IF FOUND THEN
      RETURN v_id;
    END IF;

    BEGIN
      INSERT INTO warehouse.stocks (product_id, procurement_id, quantity, storage_location)
      VALUES (p_product_id, p_procurement_id, p_delta, p_storage_location)
      RETURNING id INTO v_id;

      RETURN v_id;
    EXCEPTION WHEN unique_violation THEN
      -- A concurrent transaction inserted the same (product, procurement).
      -- The savepoint rolled back our counter increment; loop and UPDATE.
      NULL;
    END;
  END LOOP;
END;
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- product_id / procurement_id are immutable after insert.
-- To "move" a stock to another product/procurement: DELETE + INSERT (new label;
-- only possible while no child row references the stock).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION warehouse.guard_stock_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.product_id IS DISTINCT FROM OLD.product_id THEN
    RAISE EXCEPTION 'warehouse.stocks.product_id is immutable';
  END IF;

  IF NEW.procurement_id IS DISTINCT FROM OLD.procurement_id THEN
    RAISE EXCEPTION 'warehouse.stocks.procurement_id is immutable';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS stocks_identity_immutable ON warehouse.stocks;
--> statement-breakpoint

CREATE TRIGGER stocks_identity_immutable
  BEFORE UPDATE OF product_id, procurement_id
  ON warehouse.stocks
  FOR EACH ROW
  EXECUTE FUNCTION warehouse.guard_stock_identity();


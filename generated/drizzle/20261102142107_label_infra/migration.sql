-- Custom migration:  drizzle-kit generate --custom --name=label_infra
-- drizzle-kit does not manage functions/triggers, so keep this file by hand.
--
-- Generic label infra. It installs triggers for EVERY label table set created
-- by createLabelTables(schema, owner, prefix), automatically:
--   * an event trigger handles every later CREATE TABLE (future owners, tests,
--     fresh databases), so nothing has to be installed per owner;
--   * the backfill at the end handles tables that already exist.
-- A table set is recognised by name + columns:
--   <owner>_label_counter   (last_seq, max_seq[, max_per_owner])
--   <owner>_label_free_seqs (seq, freed_at)
--   <owner>_labels          (seq, <owner>_id[, slot])
-- Everything is idempotent, so this file can run before or after the migration
-- that creates the tables. Creating the event trigger needs superuser.
--
-- Allocation policy (per owner, own counter)
--   Phase 1: fresh numbers 1..max_seq from the single-row counter.
--   Phase 2: once last_seq = max_seq, reuse the smallest number in free_label_seqs.
--   Both phases run inside the inserting transaction, so a rollback gives the
--   number back automatically (no gaps).
--
-- Slot policy (per owner row, optional)
--   If <owner>_labels has a `slot` column, the BEFORE INSERT trigger
--   <owner>_labels_assign_slot gives the new label the smallest free slot
--   (1..max_per_owner) of its owner row; callers just INSERT (owner_id). The
--   ceiling max_per_owner lives in <owner>_label_counter (seeded from the
--   createLabelTables parameter via the column default) and may be changed
--   with a plain UPDATE; lowering it never deletes existing labels. When every
--   slot is taken the insert fails with check_violation (23514).
--   The trigger re-locks the counter row (FOR UPDATE), so inserts of the same
--   owner table are serialized whatever the trigger order is; the unique
--   (owner_id, slot) constraint is the last safety net (e.g. REPEATABLE READ).
--
-- Concurrency
--   next_label_seq() first takes a row lock on the counter, which serializes
--   every allocation of that owner until commit/rollback (keep transactions
--   that create new labels short). Consequently the free pool is never
--   contended by another allocator, so SKIP LOCKED is not needed. Numbers
--   freed by a purge transaction that has not committed yet are invisible to
--   the allocator; this only matters after the ceiling is reached.
--
-- Do NOT use INSERT ... ON CONFLICT DO NOTHING (Drizzle onConflictDoNothing)
-- on <owner>_labels: the BEFORE INSERT trigger runs before conflict detection,
-- and when the statement then inserts nothing, the counter increment is kept.

CREATE SCHEMA IF NOT EXISTS infra;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Allocator. p_counter / p_free are regclass: validated, safely quoted.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION infra.next_label_seq(p_counter regclass, p_free regclass)
RETURNS bigint
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_last bigint;
  v_max  bigint;
  v_seq  bigint;
BEGIN
  EXECUTE format('SELECT last_seq, max_seq FROM %s WHERE singleton FOR UPDATE', p_counter)
    INTO v_last, v_max;

  IF v_last IS NULL THEN
    RAISE EXCEPTION '% counter row is missing', p_counter;
  END IF;

  -- Phase 1: fresh number
  IF v_last < v_max THEN
    EXECUTE format('UPDATE %s SET last_seq = $1 WHERE singleton', p_counter)
      USING v_last + 1;
    RETURN v_last + 1;
  END IF;

  -- Phase 2: ceiling reached, reuse the smallest freed number
  EXECUTE format($f$
    DELETE FROM %1$s
     WHERE seq = (SELECT seq FROM %1$s ORDER BY seq LIMIT 1 FOR UPDATE)
    RETURNING seq
  $f$, p_free) INTO v_seq;

  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'label seq space exhausted for % (max_seq = %)', p_counter, v_max
      USING ERRCODE = 'program_limit_exceeded';
  END IF;

  RETURN v_seq;
END;
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- <owner>_labels: assign seq on insert (overrides any supplied value).
-- TG_ARGV: [0] = counter table, [1] = free_seqs table.
-- The generated column id is computed after BEFORE triggers.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION infra.label_assign_seq()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.seq := infra.next_label_seq(TG_ARGV[0]::regclass, TG_ARGV[1]::regclass);
  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- <owner>_labels: release seq on delete (no ON CONFLICT on purpose: a
-- duplicate means corruption and must fail loudly). Rolls back with the delete.
-- TG_ARGV: [0] = free_seqs table.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION infra.label_release_seq()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('INSERT INTO %s (seq) VALUES ($1)', TG_ARGV[0]::regclass)
    USING OLD.seq;
  RETURN OLD;
END;
$$;
--> statement-breakpoint

-- labels.seq is immutable after insert
CREATE OR REPLACE FUNCTION infra.label_forbid_seq_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.seq IS DISTINCT FROM OLD.seq THEN
    RAISE EXCEPTION '%.seq is immutable', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- <owner>_labels: assign the smallest free slot of the owner row on insert
-- (overrides any supplied value). The ceiling comes from the counter table.
-- TG_ARGV: [0] = owner FK column name, [1] = counter table.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION infra.label_assign_slot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_owner text := to_jsonb(NEW) ->> TG_ARGV[0];
  v_max   int;
  v_slot  int;
BEGIN
  -- Same lock next_label_seq() takes: serializes inserts of this owner table.
  EXECUTE format('SELECT max_per_owner FROM %s WHERE singleton FOR UPDATE',
                 TG_ARGV[1]::regclass)
    INTO v_max;

  IF v_max IS NULL THEN
    RAISE EXCEPTION '% counter row is missing', TG_ARGV[1];
  END IF;

  EXECUTE format($f$
    SELECT g.s
      FROM generate_series(1, $2) AS g(s)
     WHERE NOT EXISTS (
             SELECT 1 FROM %1$s l
              WHERE l.%2$I = $1::uuid AND l.slot = g.s)
     ORDER BY g.s
     LIMIT 1
  $f$, TG_RELID::regclass, TG_ARGV[0])
    INTO v_slot
    USING v_owner, v_max;

  IF v_slot IS NULL THEN
    RAISE EXCEPTION 'owner % already has % labels', v_owner, v_max
      USING ERRCODE = 'check_violation';
  END IF;

  NEW.slot := v_slot;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- labels.slot is immutable after insert (DELETE + INSERT to move a label).
CREATE OR REPLACE FUNCTION infra.label_forbid_slot_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slot IS DISTINCT FROM OLD.slot THEN
    RAISE EXCEPTION '%.slot is immutable', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- labels.<owner>_id is immutable. To "move" a label: DELETE + INSERT (new number).
-- TG_ARGV: [0] = owner FK column name.
CREATE OR REPLACE FUNCTION infra.label_guard_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF to_jsonb(NEW) -> TG_ARGV[0] IS DISTINCT FROM to_jsonb(OLD) -> TG_ARGV[0] THEN
    RAISE EXCEPTION '%.% is immutable (DELETE + INSERT to move a label)',
      TG_TABLE_NAME, TG_ARGV[0];
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- counter: may only advance by exactly one (via next_label_seq); the row can
-- never be deleted. Changing max_seq or max_per_owner alone is allowed.
CREATE OR REPLACE FUNCTION infra.label_guard_counter()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION '%.% row cannot be deleted', TG_TABLE_SCHEMA, TG_TABLE_NAME;
  END IF;

  IF NEW.singleton IS DISTINCT FROM OLD.singleton THEN
    RAISE EXCEPTION '%.singleton is immutable', TG_TABLE_NAME;
  END IF;

  IF NEW.last_seq <> OLD.last_seq AND NEW.last_seq <> OLD.last_seq + 1 THEN
    RAISE EXCEPTION '%.last_seq may only advance by one (old %, new %)',
      TG_TABLE_NAME, OLD.last_seq, NEW.last_seq;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- TRUNCATE does not fire row triggers: it would lose freed numbers (gaps) or
-- desynchronize the counter. Block it. In tests, disable these triggers
-- explicitly (ALTER TABLE ... DISABLE TRIGGER ...) if you need to truncate.
CREATE OR REPLACE FUNCTION infra.forbid_truncate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'TRUNCATE is forbidden on %.%', TG_TABLE_SCHEMA, TG_TABLE_NAME;
END;
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION infra._set_trigger(
  p_name  text,
  p_table regclass,
  p_when  text,
  p_tail  text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', p_name, p_table);
  EXECUTE format('CREATE TRIGGER %I %s ON %s %s', p_name, p_when, p_table, p_tail);
END;
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION infra._has_col(p_rel regclass, p_col text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM pg_attribute
     WHERE attrelid = p_rel
       AND attname = p_col
       AND attnum > 0
       AND NOT attisdropped
  );
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Looks at ONE table; if it has the shape of a label table, installs its
-- triggers. Trigger arguments are names resolved at run time, so the creation
-- order of the three tables does not matter.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION infra.try_install_label_table(p_rel regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema    text;
  v_name      text;
  v_base      text;
  v_counter   text;
  v_free      text;
  v_owner_col text;
BEGIN
  SELECT n.nspname, c.relname
    INTO v_schema, v_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE c.oid = p_rel;

  IF v_schema IN ('pg_catalog', 'information_schema', 'infra') THEN
    RETURN;
  END IF;

  -- <owner>_label_counter
  IF v_name ~ '_label_counter$'
     AND infra._has_col(p_rel, 'last_seq')
     AND infra._has_col(p_rel, 'max_seq') THEN
    -- Seed (ceiling = 12 digits; raising it later is allowed).
    -- max_per_owner (if the table has it) takes its column default, which
    -- createLabelTables sets from its maxPerOwner parameter.
    EXECUTE format(
      'INSERT INTO %s (singleton, last_seq, max_seq) VALUES (true, 0, 999999999999)
       ON CONFLICT (singleton) DO NOTHING', p_rel);
    PERFORM infra._set_trigger(v_name || '_guard_update', p_rel, 'BEFORE UPDATE',
      'FOR EACH ROW EXECUTE FUNCTION infra.label_guard_counter()');
    PERFORM infra._set_trigger(v_name || '_guard_delete', p_rel, 'BEFORE DELETE',
      'FOR EACH ROW EXECUTE FUNCTION infra.label_guard_counter()');
    PERFORM infra._set_trigger(v_name || '_no_truncate', p_rel, 'BEFORE TRUNCATE',
      'FOR EACH STATEMENT EXECUTE FUNCTION infra.forbid_truncate()');
    RETURN;
  END IF;

  -- <owner>_label_free_seqs
  IF v_name ~ '_label_free_seqs$'
     AND infra._has_col(p_rel, 'seq')
     AND infra._has_col(p_rel, 'freed_at') THEN
    PERFORM infra._set_trigger(v_name || '_no_truncate', p_rel, 'BEFORE TRUNCATE',
      'FOR EACH STATEMENT EXECUTE FUNCTION infra.forbid_truncate()');
    RETURN;
  END IF;

  -- <owner>_labels (needs seq + <owner>_id, so unrelated *_labels tables are ignored)
  IF v_name ~ '_labels$' THEN
    v_base      := regexp_replace(v_name, '_labels$', '');
    v_owner_col := v_base || '_id';

    IF infra._has_col(p_rel, 'seq') AND infra._has_col(p_rel, v_owner_col) THEN
      v_counter := format('%I.%I', v_schema, v_base || '_label_counter');
      v_free    := format('%I.%I', v_schema, v_base || '_label_free_seqs');

      PERFORM infra._set_trigger(v_name || '_assign_seq', p_rel, 'BEFORE INSERT',
        format('FOR EACH ROW EXECUTE FUNCTION infra.label_assign_seq(%L, %L)',
               v_counter, v_free));
      PERFORM infra._set_trigger(v_name || '_release_seq', p_rel, 'AFTER DELETE',
        format('FOR EACH ROW EXECUTE FUNCTION infra.label_release_seq(%L)', v_free));
      PERFORM infra._set_trigger(v_name || '_seq_immutable', p_rel, 'BEFORE UPDATE OF seq',
        'FOR EACH ROW EXECUTE FUNCTION infra.label_forbid_seq_change()');
      PERFORM infra._set_trigger(v_name || '_owner_immutable', p_rel,
        format('BEFORE UPDATE OF %I', v_owner_col),
        format('FOR EACH ROW EXECUTE FUNCTION infra.label_guard_owner(%L)', v_owner_col));

      -- Optional slots: only label tables that have a `slot` column.
      -- The counter table is resolved at run time (creation order is free), so
      -- it must have max_per_owner by the time the first label is inserted.
      IF infra._has_col(p_rel, 'slot') THEN
        PERFORM infra._set_trigger(v_name || '_assign_slot', p_rel, 'BEFORE INSERT',
          format('FOR EACH ROW EXECUTE FUNCTION infra.label_assign_slot(%L, %L)',
                 v_owner_col, v_counter));
        PERFORM infra._set_trigger(v_name || '_slot_immutable', p_rel, 'BEFORE UPDATE OF slot',
          'FOR EACH ROW EXECUTE FUNCTION infra.label_forbid_slot_change()');
      END IF;

      PERFORM infra._set_trigger(v_name || '_no_truncate', p_rel, 'BEFORE TRUNCATE',
        'FOR EACH STATEMENT EXECUTE FUNCTION infra.forbid_truncate()');
    END IF;
  END IF;
END;
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Event trigger: runs after every CREATE TABLE (also inside later migrations).
-- If anything fails, the CREATE TABLE fails loudly instead of leaving a label
-- table without its triggers.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION infra.on_create_table()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT objid
      FROM pg_event_trigger_ddl_commands()
     WHERE command_tag = 'CREATE TABLE'
       AND object_type = 'table'
  LOOP
    PERFORM infra.try_install_label_table(r.objid::regclass);
  END LOOP;
END;
$$;
--> statement-breakpoint

DROP EVENT TRIGGER IF EXISTS infra_label_tables;
--> statement-breakpoint

CREATE EVENT TRIGGER infra_label_tables
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION infra.on_create_table();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Backfill: label tables that already exist when this migration runs.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.oid
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r'
       AND NOT c.relispartition
       AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'infra')
  LOOP
    PERFORM infra.try_install_label_table(r.oid::regclass);
  END LOOP;
END;
$$;
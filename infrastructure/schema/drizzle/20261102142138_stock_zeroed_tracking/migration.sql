-- Custom migration:  drizzle-kit generate --custom --name=stock_zeroed_tracking
-- drizzle-kit does not manage functions/triggers, so keep this file by hand.
-- Must run AFTER the migration that creates warehouse.stocks.
--
-- zeroed_at = moment quantity became 0; NULL while quantity > 0.
-- Used by the purge job (grace period) and enforced by
-- stocks_zeroed_at_consistent_chk. BEFORE triggers run before CHECKs, so the
-- constraint always sees the final value.
-- OLD is only touched inside the TG_OP = 'UPDATE' branch (it is not
-- available in INSERT triggers).

CREATE OR REPLACE FUNCTION warehouse.track_stock_zeroed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quantity = 0 THEN
    IF TG_OP = 'UPDATE' THEN
      IF OLD.quantity = 0 AND OLD.zeroed_at IS NOT NULL THEN
        NEW.zeroed_at := OLD.zeroed_at;   -- still zero: keep original moment
      ELSE
        NEW.zeroed_at := now();
      END IF;
    ELSE
      NEW.zeroed_at := now();
    END IF;
  ELSE
    NEW.zeroed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS stocks_track_zeroed ON warehouse.stocks;
--> statement-breakpoint

CREATE TRIGGER stocks_track_zeroed
  BEFORE INSERT OR UPDATE OF quantity ON warehouse.stocks
  FOR EACH ROW
  EXECUTE FUNCTION warehouse.track_stock_zeroed();
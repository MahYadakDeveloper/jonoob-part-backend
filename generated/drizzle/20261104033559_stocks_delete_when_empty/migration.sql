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
CREATE FUNCTION actors.forbid_wallet_tx_update () RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'wallet_transactions rows are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_tx_no_update
BEFORE UPDATE ON actors.wallet_transactions FOR EACH ROW
EXECUTE FUNCTION actors.forbid_wallet_tx_update ();

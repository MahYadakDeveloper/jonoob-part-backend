import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  foreignKey,
  index,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
// adjust these two imports to your project layout
import { customers } from './customers.schema';
import { actorsSchema } from './actors.schema';

/**
 * Wallet model
 * ------------
 * - wallets.available_balance : spendable money (single stored number).
 * - freezed_amounts           : one row per hold. Rows are NEVER deleted on
 *                               commit/release; they only change status.
 *                               A hold is always settled in FULL (no partial
 *                               commit).
 * - frozen amount             : derived as
 *                               SUM(freezed_amounts.amount) WHERE status = 'active'.
 * - total                     : available + frozen (derived).
 * - wallet_transactions       : ledger; every row is a snapshot of the moment
 *                               (availableBalanceAfter). Freeze-related rows
 *                               DEPEND on their freezed_amounts row: deleting a
 *                               freezed_amounts row cascades to its freeze /
 *                               commit_freeze / unfreeze transactions.
 *
 * Effect of each transaction type (all inside ONE db transaction, after
 * `SELECT ... FOR UPDATE` on the wallet row):
 *
 *   type           | available_balance | freezed_amounts
 *   ---------------+-------------------+------------------------------------
 *   credit         | +amount           | -
 *   debit          | -amount           | -
 *   freeze         | -amount           | insert row, status = active
 *   unfreeze       | +freeze.amount    | status = released, settled_at = now
 *   commit_freeze  | unchanged         | status = committed, settled_at = now
 *                  |  (money already left available when frozen; the whole
 *                  |   hold is spent)
 *
 * Order inside the DB transaction:
 *   freeze : insert freezed_amounts -> insert wallet_transactions(freeze)
 *   settle : read active freeze -> insert wallet_transactions(commit_freeze |
 *            unfreeze, amount = freeze.amount) -> update freezed_amounts status
 *
 * Invariants enforced in the service (cross-table, CHECK cannot see them):
 *   - freeze row + freeze tx are created together, amounts equal
 *   - commit_freeze.amount = unfreeze.amount = freeze.amount
 *   - settle only when status = 'active'; tx type matches the new status
 *     (commit_freeze <-> committed, unfreeze <-> released)
 *   - deleting a freezed_amounts row does NOT touch available_balance; the
 *     service must compensate if such a delete is ever done
 */

export const walletTransactionType = actorsSchema.enum(
  'wallet_transaction_type',
  ['credit', 'debit', 'freeze', 'commit_freeze', 'unfreeze'],
);

export const walletTransactionReason = actorsSchema.enum(
  'wallet_transaction_reason',
  [
    'cashback_reversal',
    'cashback',
    'manual_adjustment',
    'purchase',
    'chargeback',
    'payout',
  ],
);

export const freezeStatus = actorsSchema.enum('freeze_status', [
  'active',
  'committed',
  'released',
]);

/* -------------------------------------------------------------------------- */
/* wallets                                                                    */
/* -------------------------------------------------------------------------- */

export const wallets = actorsSchema.table(
  'wallets',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .unique()
      .references(() => customers.id, { onDelete: 'restrict' }),
    availableBalance: bigint('available_balance', { mode: 'number' })
      .notNull()
      .default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      'chk_wallets_available_non_negative',
      sql`${t.availableBalance} >= 0`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* freezed_amounts (one row per hold, kept after commit / release)            */
/* -------------------------------------------------------------------------- */

export const freezedAmounts = actorsSchema.table(
  'freezed_amounts',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'restrict' }),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    reason: walletTransactionReason('reason').notNull(),
    status: freezeStatus('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    settledAt: timestamp('settled_at', { withTimezone: true }),
  },
  (t) => [
    // target of the composite FK from wallet_transactions
    unique('uq_freezed_amounts_id_wallet').on(t.id, t.walletId),

    check('chk_freezed_amount_positive', sql`${t.amount} > 0`),
    check(
      'chk_freezed_status_consistency',
      sql`(${t.status} = 'active') = (${t.settledAt} IS NULL)`,
    ),
    check(
      'chk_freezed_reason',
      sql`${t.reason} NOT IN ('cashback', 'cashback_reversal', 'chargeback')`,
    ),

    // fast SUM of active holds per wallet
    index('idx_freezed_amounts_active')
      .on(t.walletId)
      .where(sql`${t.status} = 'active'`),
  ],
);

/* -------------------------------------------------------------------------- */
/* wallet_transactions (ledger; freeze-related rows depend on freezed_amounts)*/
/* -------------------------------------------------------------------------- */

export const walletTransactions = actorsSchema.table(
  'wallet_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'restrict' }),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
    type: walletTransactionType('type').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    reason: walletTransactionReason('reason').notNull(),
    note: text('note'),

    // set for freeze / commit_freeze / unfreeze only
    freezedAmountId: uuid('freezed_amount_id'),

    // what this movement is about (order, payout request, ...)
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),

    // snapshot of wallet.available_balance right after this transaction
    availableBalanceAfter: bigint('available_balance_after', {
      mode: 'number',
    }).notNull(),

    performedBy: uuid('performed_by'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('uq_wallet_tx_idempotency').on(t.walletId, t.idempotencyKey),

    // a tx may only reference a freeze of the SAME wallet;
    // deleting the freeze cascades to all of its transactions
    foreignKey({
      name: 'fk_wallet_tx_freeze_same_wallet',
      columns: [t.freezedAmountId, t.walletId],
      foreignColumns: [freezedAmounts.id, freezedAmounts.walletId],
    }).onDelete('cascade'),

    check('chk_wallet_tx_amount_positive', sql`${t.amount} > 0`),
    check(
      'chk_wallet_tx_balance_after_non_negative',
      sql`${t.availableBalanceAfter} >= 0`,
    ),
    check(
      'chk_wallet_tx_idempotency_not_empty',
      sql`length(${t.idempotencyKey}) > 0`,
    ),
    check(
      'chk_wallet_tx_freeze_ref',
      sql`(${t.type} IN ('freeze', 'commit_freeze', 'unfreeze'))
          = (${t.freezedAmountId} IS NOT NULL)`,
    ),
    check(
      'chk_wallet_tx_reference_pair',
      sql`(${t.referenceType} IS NULL) = (${t.referenceId} IS NULL)`,
    ),
    check(
      'chk_wallet_tx_reason_type',
      sql`(${t.reason} <> 'cashback' OR ${t.type} = 'credit')
          AND (${t.reason} NOT IN ('cashback_reversal', 'chargeback') OR ${t.type} = 'debit')
          AND (${t.reason} <> 'payout' OR ${t.type} <> 'credit')`,
    ),
    check(
      'chk_wallet_tx_manual_adjustment',
      sql`${t.reason} <> 'manual_adjustment'
          OR (${t.note} IS NOT NULL AND ${t.performedBy} IS NOT NULL)`,
    ),

    // each freeze row has exactly one 'freeze' tx ...
    uniqueIndex('uq_wallet_tx_freeze_open')
      .on(t.freezedAmountId)
      .where(sql`${t.type} = 'freeze'`),
    // ... and is settled at most once (commit_freeze OR unfreeze)
    uniqueIndex('uq_wallet_tx_freeze_settlement')
      .on(t.freezedAmountId)
      .where(sql`${t.type} IN ('commit_freeze', 'unfreeze')`),

    index('idx_wallet_tx_wallet_created').on(t.walletId, t.createdAt.desc()),
    index('idx_wallet_tx_reference').on(t.referenceType, t.referenceId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Add manually in a custom migration: ledger rows are immutable              */
/* -------------------------------------------------------------------------- */
/*
-- UPDATE is forbidden. DELETE is intentionally allowed so that removing a
-- freezed_amounts row can cascade to its transactions.
CREATE FUNCTION actors.forbid_wallet_tx_update() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'wallet_transactions rows are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_tx_no_update
BEFORE UPDATE ON actors.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION actors.forbid_wallet_tx_update();
*/

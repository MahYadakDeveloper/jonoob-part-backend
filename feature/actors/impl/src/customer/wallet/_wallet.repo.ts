import { assertOne } from '@feature/shared/utils/assertions';
import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import {
  actorsRelations,
  freezedAmounts,
  wallets,
  walletTransactionReason,
  walletTransactions,
  walletTransactionType,
} from '@infra/db-drizzle/schema';
import { NotFoundException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { and, DBQueryConfigWith, eq, sql } from 'drizzle-orm';

/**
 * Wallet repository contract.
 *
 * Rules:
 * - Every mutating method runs: lock wallet row (SELECT ... FOR UPDATE)
 *   -> idempotency check -> validate -> update balance -> insert ledger row
 *   -> (freeze rows) -> all inside ONE db transaction.
 * - No generic update/delete: balance only changes through these methods.
 * - Replayed idempotency key => returns the original result with replayed=true.
 *   Same key with a different payload => IdempotencyConflictError.
 */

export type WalletTxReason =
  (typeof walletTransactionReason.enumValues)[number];
export type WalletTxType = (typeof walletTransactionType.enumValues)[number];
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export interface WalletBalance {
  available: number;
  frozen: number; // SUM(amount) of active freezes
  total: number; // available + frozen
}

/* ------------------------------- commands -------------------------------- */

interface BaseCommand {
  walletId: string;
  idempotencyKey: string;
  reason: WalletTxReason;
  note?: string;
  reference?: { type: string; id: string }; // both or none
  createdBy?: string; // required when reason = manual_adjustment
}

export interface MoveCommand extends BaseCommand {
  amount: number; // > 0
}

/** commit/unfreeze take no amount: the whole hold is settled. */
export interface SettleFreezeCommand extends BaseCommand {
  freezeId: string;
}

export interface MovementResult {
  transaction: WalletTransaction;
  balanceAfter: WalletBalance;
  replayed: boolean;
}

export interface FreezeResult extends MovementResult {
  freeze: typeof freezedAmounts.$inferSelect;
}

export interface ListTransactionsQuery {
  walletId: string;
  types?: WalletTxType[];
  reasons?: WalletTxReason[];
  reference?: { type: string; id?: string };
  cursor?: string; // keyset on (createdAt desc, id)
  limit?: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

const withFreezed = {
  freezedAmounts: {
    columns: {
      id: false,
      settledAt: false,
      walletId: false,
      status: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  },
} satisfies DBQueryConfigWith<
  typeof actorsRelations,
  typeof actorsRelations.wallets.relations
>;

export class WalletRepository extends DrizzleBaseRepository<
  typeof actorsRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof actorsRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  findById(id: string) {
    return this.db.query.wallets.findFirst({
      where: {
        id,
      },
      with: { ...withFreezed },
    });
  }

  findByCustomerId(customerId: string) {
    this.db.query.wallets.findFirst({
      where: {
        customerId,
      },
      with: { ...withFreezed },
    });
  }

  async getBalance(id: string): Promise<WalletBalance> {
    const query = this.db
      .select({
        available: wallets.availableBalance,
        frozen: sql<number>`coalesce(sum(${freezedAmounts.amount}), 0)`.mapWith(
          Number,
        ),
      })
      .from(wallets)
      .leftJoin(
        freezedAmounts,
        and(
          eq(freezedAmounts.walletId, wallets.id),
          sql`${freezedAmounts.status} = 'active'`,
        ),
      )
      .where(eq(wallets.id, id))
      .groupBy(wallets.id);

    const rows = await (this.forUpdateCtx.getStore() === 'for_update'
      ? query.for('update')
      : query);

    assertOne(rows, () => new WalletNotFoundError());

    const [balance] = rows;

    return {
      ...balance,
      total: balance.available + balance.frozen,
    };
  }

  findFreezeById(walletId: string, freezeId: string) {}
  listActiveFreezes(walletId: string) {}

  findTransactionByIdempotencyKey(walletId: string, idempotencyKey: string) {}

  listTransactions(
    q: ListTransactionsQuery,
  ): Promise<Page<WalletTransaction>> {}

  findTransactionsByReference(
    referenceType: string,
    referenceId: string,
  ): Promise<WalletTransaction[]> {}

  /* ---- movements (each atomic + idempotent) ---- */
  credit(cmd: MoveCommand): Promise<MovementResult> {}

  /** Throws InsufficientBalanceError. */
  debit(cmd: MoveCommand): Promise<MovementResult> {}

  /** available -= amount, creates an active hold. Throws InsufficientBalanceError. */
  freeze(cmd: MoveCommand): Promise<FreezeResult> {}

  /** Spends the whole hold; available unchanged. Throws FreezeNotActiveError. */
  commitFreeze(cmd: SettleFreezeCommand): Promise<FreezeResult> {}

  /** Returns the whole hold to available. Throws FreezeNotActiveError. */
  unfreeze(cmd: SettleFreezeCommand): Promise<FreezeResult> {}
}

export class WalletNotFoundError extends Error {}
export class FreezeNotFoundError extends Error {}
export class FreezeNotActiveError extends Error {}
export class InsufficientBalanceError extends Error {}
export class IdempotencyConflictError extends Error {}

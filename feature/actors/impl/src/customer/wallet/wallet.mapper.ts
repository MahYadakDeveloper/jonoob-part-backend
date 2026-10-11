import {
  FreezeWalletAmountRequest,
  RefundWalletRequest,
  ReleaseFrozenAmountRequest,
  WalletDepositRequest,
  WalletWithdrawRequest,
} from '@feature/actors-api/customer/wallet';
import { WalletTransactionCreate } from './transaction/transaction.repository';

export const toDepositTransaction = (
  walletId: string,
  req: WalletDepositRequest,
): WalletTransactionCreate => ({
  walletId,
  type: 'deposit',
  amount: req.amount,
  reason: req.reason,
  idempotencyKey: req.idempotencyKey,
  description: req.description ?? null,
});

export const toWithdrawTransaction = (
  walletId: string,
  req: WalletWithdrawRequest,
): WalletTransactionCreate => ({
  walletId,
  type: 'withdraw',
  amount: req.amount,
  reason: req.reason,
  idempotencyKey: req.idempotencyKey,
  description: req.description ?? null,
});

// A refund is a deposit with reason 'refund'
export const toRefundTransaction = (
  walletId: string,
  req: RefundWalletRequest,
): WalletTransactionCreate => ({
  walletId,
  type: 'deposit',
  amount: req.amount,
  reason: 'refund',
  idempotencyKey: req.idempotencyKey,
  description: req.description ?? null,
});

export const toFreezeTransaction = (
  walletId: string,
  req: FreezeWalletAmountRequest & { idempotencyKey: string },
): WalletTransactionCreate => ({
  walletId,
  type: 'freeze',
  amount: req.amount,
  reason: req.reason,
  idempotencyKey: req.idempotencyKey,
  description: null,
});

// Commit and release only carry a freezeId, so amount and walletId come from the freeze record.
// The key is derived from the freeze, so repeating the call is safe.
type FreezeRecord = { id: string; walletId: string; amount: number };

export const toCommitTransaction = (
  freeze: FreezeRecord,
): WalletTransactionCreate => ({
  walletId: freeze.walletId,
  type: 'withdraw',
  amount: freeze.amount,
  reason: 'withdrawal',
  idempotencyKey: `commit:${freeze.id}`,
  description: null,
});

export const toReleaseTransaction = (
  freeze: FreezeRecord,
  req: ReleaseFrozenAmountRequest,
): WalletTransactionCreate => ({
  walletId: freeze.walletId,
  type: 'unfreeze',
  amount: freeze.amount,
  reason: req.reason,
  idempotencyKey: `release:${freeze.id}`,
  description: null,
});

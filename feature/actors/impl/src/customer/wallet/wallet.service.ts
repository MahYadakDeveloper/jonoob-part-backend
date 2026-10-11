import {
  CommitFrozenAmountRequest,
  FreezeWalletAmountRequest,
  FrozenBalanceResponse,
  ReleaseFrozenAmountRequest,
  WalletApi,
  WalletDepositRequest,
  WalletTransactionResponse,
  WalletWithdrawRequest,
} from '@feature/actors-api/customer/wallet';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { WalletRepository, WalletTransaction } from './wallet.repository';

@Injectable()
export class WalletService implements WalletApi {
  constructor(
    private readonly repository: WalletRepository,
    private readonly tx: DrizzleTransactionContext,
  ) {}

  pageTransactions(
    customerId: string,
    criteria: Parameters<WalletRepository['pageTransactions']>[1],
  ) {
    return this.repository.pageTransactions(customerId, criteria);
  }

  deposit(req: WalletDepositRequest): Promise<WalletTransactionResponse> {
    return this.executeIdempotently('deposit', req, (walletId, amount) =>
      this.repository.increaseBalance(walletId, amount),
    );
  }

  withdraw(req: WalletWithdrawRequest): Promise<WalletTransactionResponse> {
    return this.executeIdempotently('withdraw', req, (walletId, amount) =>
      this.repository.decreaseBalance(walletId, amount),
    );
  }

  commitFrozen(
    req: CommitFrozenAmountRequest,
  ): Promise<WalletTransactionResponse> {
    throw new Error('Method not implemented.');
  }

  freeze(req: FreezeWalletAmountRequest): Promise<FrozenBalanceResponse> {
    throw new Error('Method not implemented.');
  }
  releaseFrozen(req: ReleaseFrozenAmountRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private executeIdempotently(
    type: WalletTransaction['type'],
    {
      customerId,
      amount,
      idempotencyKey,
      reason,
      description,
    }: WalletDepositRequest | WalletWithdrawRequest,
    applyBalance: (
      walletId: string,
      amount: number,
    ) => Promise<{ id: string } | null>,
  ): Promise<WalletTransactionResponse> {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive integer');
    }

    return this.repository.withLock(
      'wallet-transaction',
      idempotencyKey,
      async () => {
        const wallet = await this.repository.findByCustomerId(customerId);
        if (!wallet) throw new NotFoundException('Customer has no wallet!');

        const existing =
          await this.repository.findTransactionByIdempotencyKeyAndWalletId(
            idempotencyKey,
            wallet.id,
          );

        if (existing) {
          if (existing.type !== type || existing.amount !== amount) {
            throw new ConflictException(
              'Idempotency key reused with a different payload',
            );
          }
          return { transactionId: existing.id };
        }

        const { id: transactionId } = await this.repository.recordTransaction({
          type,
          walletId: wallet.id,
          idempotencyKey,
          amount,
          reason,
          description,
        });

        const updated = await applyBalance(wallet.id, amount);
        if (!updated)
          switch (type) {
            case 'withdraw':
              throw new UnprocessableEntityException('Insufficient funds');
            case 'deposit':
              throw new NotFoundException('Customer has no wallet!');
          }

        return { transactionId };
      },
    );
  }
}

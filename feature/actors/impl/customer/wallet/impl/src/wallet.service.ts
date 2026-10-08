import {
  CommitFrozenAmountRequest,
  FreezeWalletAmountRequest,
  FrozenBalanceResponse,
  ReleaseFrozenAmountRequest,
  WalletApi,
  WalletDepositRequest,
  WalletTransactionResponse,
  WalletWithdrawRequest,
} from '@feature/customer-wallet-api';
import { Inject, Injectable } from '@nestjs/common';
import type { WalletRepository } from './wallet.repository';

@Injectable()
export class WalletService implements WalletApi {
  constructor(
    @Inject('WalletRepository')
    private readonly repository: WalletRepository,
  ) {}

  deposit(req: WalletDepositRequest): Promise<WalletTransactionResponse> {
    throw new Error('Method not implemented.');
  }
  withdraw(req: WalletWithdrawRequest): Promise<WalletTransactionResponse> {
    throw new Error('Method not implemented.');
  }
  freeze(req: FreezeWalletAmountRequest): Promise<FrozenBalanceResponse> {
    throw new Error('Method not implemented.');
  }
  commitFrozen(
    req: CommitFrozenAmountRequest,
  ): Promise<WalletTransactionResponse> {
    throw new Error('Method not implemented.');
  }
  releaseFrozen(req: ReleaseFrozenAmountRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

import {
  CommitFrozenAmountRequest,
  FreezeWalletAmountRequest,
  FrozenBalanceResponse,
  GetWalletBalanceRequest,
  GetWalletBalanceResponse,
  ReleaseFrozenAmountRequest,
  WalletApi,
  WalletDepositRequest,
  WalletTransactionResponse,
  WalletWithdrawRequest,
} from '@feature/customer-wallet-api';

export class WalletService implements WalletApi {
  constructor() {}
  getBalance(req: GetWalletBalanceRequest): Promise<GetWalletBalanceResponse> {
    throw new Error('Method not implemented.');
  }
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

import {
  CommitFrozenAmountRequest,
  FreezeWalletAmountRequest,
  ReleaseFrozenAmountRequest,
  WalletDepositRequest,
  WalletWithdrawRequest,
} from './wallet.req';
import { FrozenBalanceResponse, WalletTransactionResponse } from './wallet.res';

export interface WalletApi {
  deposit(req: WalletDepositRequest): Promise<WalletTransactionResponse>;

  withdraw(req: WalletWithdrawRequest): Promise<WalletTransactionResponse>;

  freeze(req: FreezeWalletAmountRequest): Promise<FrozenBalanceResponse>;

  commitFrozen(
    req: CommitFrozenAmountRequest,
  ): Promise<WalletTransactionResponse>;

  releaseFrozen(req: ReleaseFrozenAmountRequest): Promise<void>;
}

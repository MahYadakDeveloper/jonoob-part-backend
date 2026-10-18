import {
  CommitFrozenAmountRequest,
  FreezeWalletAmountRequest,
  GetWalletBalanceRequest,
  ReleaseFrozenAmountRequest,
  WalletDepositRequest,
  WalletWithdrawRequest,
} from './wallet.req';
import {
  FrozenBalanceResponse,
  GetWalletBalanceResponse,
  WalletTransactionResponse,
} from './wallet.res';

export const WALLET_API = Symbol('WalletApi');
export interface WalletApi {
  getBalance(req: GetWalletBalanceRequest): Promise<GetWalletBalanceResponse>;

  deposit(req: WalletDepositRequest): Promise<WalletTransactionResponse>;

  withdraw(req: WalletWithdrawRequest): Promise<WalletTransactionResponse>;

  freeze(req: FreezeWalletAmountRequest): Promise<FrozenBalanceResponse>;

  commitFrozen(
    req: CommitFrozenAmountRequest,
  ): Promise<WalletTransactionResponse>;

  releaseFrozen(req: ReleaseFrozenAmountRequest): Promise<void>;
}

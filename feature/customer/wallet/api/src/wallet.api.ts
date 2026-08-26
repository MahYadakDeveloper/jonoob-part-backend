import {
  CommitFrozenAmountRequest,
  FreezeWalletAmountRequest,
  GetWalletBalanceRequest,
  ReleaseFrozenAmountRequest,
  WalletDepositRequest,
  WalletWithdrawRequest,
} from "./wallet.requests";
import {
  FrozenBalanceResponse,
  GetWalletBalanceResponse,
  WalletTransactionResponse,
} from "./wallet.responses";

export interface WalletApi {
  deposit(req: WalletDepositRequest): Promise<WalletTransactionResponse>;

  withdraw(req: WalletWithdrawRequest): Promise<WalletTransactionResponse>;

  getBalance(req: GetWalletBalanceRequest): Promise<GetWalletBalanceResponse>;

  freeze(req: FreezeWalletAmountRequest): Promise<FrozenBalanceResponse>;

  commitFrozen(
    req: CommitFrozenAmountRequest,
  ): Promise<WalletTransactionResponse>;

  releaseFrozen(req: ReleaseFrozenAmountRequest): Promise<void>;
}

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
} from "@feature/wallet-api";

/**
 * Internal implementation of the Wallet API used by domain/application services.
 *
 * This class acts as an internal adapter around wallet operations and must not be
 * exposed directly through HTTP controllers or API endpoints. External clients
 * should interact with the wallet through higher-level application services.
 */
export class WalletApiImpl implements WalletApi {
  constructor() {}

  deposit(req: WalletDepositRequest): Promise<WalletTransactionResponse> {
    throw new Error("Method not implemented.");
  }
  withdraw(req: WalletWithdrawRequest): Promise<WalletTransactionResponse> {
    throw new Error("Method not implemented.");
  }
  getBalance(req: GetWalletBalanceRequest): Promise<GetWalletBalanceResponse> {
    throw new Error("Method not implemented.");
  }
  freeze(req: FreezeWalletAmountRequest): Promise<FrozenBalanceResponse> {
    throw new Error("Method not implemented.");
  }
  commitFrozen(
    req: CommitFrozenAmountRequest,
  ): Promise<WalletTransactionResponse> {
    throw new Error("Method not implemented.");
  }
  releaseFrozen(req: ReleaseFrozenAmountRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

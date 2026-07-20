import {
  CreditWalletRequest,
  DebitWalletRequest,
  GetWalletBalanceRequest,
} from "./wallet.requests";
import { GetWalletBalanceResponse } from "./wallet.responses";
import { WalletTransactionResult } from "./wallet.types";

export interface WalletApi {
  credit(req: CreditWalletRequest): Promise<WalletTransactionResult>;
  debit(req: DebitWalletRequest): Promise<WalletTransactionResult>;
  getBalance(req: GetWalletBalanceRequest): Promise<GetWalletBalanceResponse>;
}

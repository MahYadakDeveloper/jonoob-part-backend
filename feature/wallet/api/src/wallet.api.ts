import { BalanceDeductionReq, WalletBalanceReq } from "./wallet.requests";
import { WalletBalanceRes } from "./wallet.responses";

export interface IWalletService {
  deductBalance(req: BalanceDeductionReq): Promise<void>;
  getWalletBalance(req: WalletBalanceReq): Promise<WalletBalanceRes>;
}

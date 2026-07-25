import {
  GetWalletBalanceRequest,
  GetWalletBalanceResponse,
} from "@feature/wallet-api";

export class WalletService {
  constructor() {}

  async getBalance(
    req: GetWalletBalanceRequest,
  ): Promise<GetWalletBalanceResponse> {
    throw new Error("Not implemented yet!");
  }
}

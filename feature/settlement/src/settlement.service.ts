import { type TransactionManager } from "@feature/common";
import { type WalletApi } from "@feature/wallet-api";
import { Injectable } from "@nestjs/common";
import { WithdrawalRequest } from "requests/withdrawal.request";
import { type SettlementRepository } from "settlement.repository";

@Injectable()
export class SettlementService {
  constructor(
    private readonly wallet: WalletApi,
    private readonly repository: SettlementRepository,
    private readonly tx: TransactionManager,
  ) {}

  /**
   * Creates a settlement request for either a customer withdrawal or a POS refund payout.
   *
   * - Customers specify the amount they want to withdraw from their wallet.
   * - POS agents specify the approved refund amount for a customer return.
   *
   * The amount is frozen immediately and the request is stored with `pending`
   * status until it is reviewed and processed by an operator.
   */
  async requestWithdrawal({
    customerId,
    amount,
    destination,
    referenceId,
    type,
  }: WithdrawalRequest) {
    await this.tx.run(async () => {
      const res = await this.wallet.freeze({
        customerId,
        amount,
        reason: type === "refund" ? "refund" : "withdrawal-request",
        referenceId,
      });

      await this.repository.createRequest({
        customerId,
        amount,
        referenceId: referenceId,
        freezeId: res.freezeId,
        destination,
        type,
      });
    });
  }

  async markAsPaid(id: string, receiptText: string) {
    await this.tx.run(async () => {
      const { freezeId, referenceId } = await this.repository.getOrThrow(id);
      await this.repository.markPaid(id, receiptText);

      await this.wallet.commitFrozen({ freezeId, referenceId });
    });
  }

  async reject(id: string, reason: string) {
    await this.tx.run(async () => {
      const { freezeId, type } = await this.repository.getOrThrow(id);

      await this.wallet.releaseFrozen({
        freezeId,
        reason: type === "refund" ? "refund" : "withdrawal-request",
      });

      await this.repository.markRejected(id, reason);
    });
  }
}

import {
  type OutboxRepository,
  type TransactionManager,
} from "@feature/common";
import {
  PayoffRequestCreatedEventType,
  RefundRequest,
  SettlementApi,
} from "@feature/settlement-api";
import { type WalletApi } from "@feature/wallet-api";
import { Injectable } from "@nestjs/common";
import { WithdrawalRequest } from "requests/withdrawal.request";
import { type SettlementRepository } from "settlement.repository";

@Injectable()
export class SettlementService implements SettlementApi {
  constructor(
    private readonly wallet: WalletApi,
    private readonly repository: SettlementRepository,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {}

  async refund(req: RefundRequest): Promise<void> {
    await this.tx.run(async () => {
      // Bank payoff
      if (req.destination) {
        if (!req.customerId) throw new Error("Customer is required for payoff");

        await this.repository.createRequest({
          type: "refund",
          customerId: req.customerId,
          referenceId: req.referenceId,
          amount: req.amount,
          destination: req.destination,
        });

        await this.outbox.save({
          type: PayoffRequestCreatedEventType,
          payload: { referenceId: req.referenceId },
        });

        return;
      }

      // Wallet credit
      if (!req.customerId)
        throw new Error("Customer is required for wallet refund");

      await this.wallet.deposit({
        customerId: req.customerId,
        amount: req.amount,
        reason: "refund",
        referenceId: req.referenceId,
        idempotencyKey: `refund:${req.referenceId}`,
        description: "Sale return refund",
      });
    });
  }

  async requestWithdrawal({
    customerId,
    amount,
    destination,
    referenceId,
    type,
  }: WithdrawalRequest) {
    await this.tx.run(async () => {
      // Only withdrawals require wallet freeze
      if (type === "withdrawal") {
        const frozen = await this.wallet.freeze({
          customerId: customerId,
          amount: amount,
          reason: "withdrawal-request",
          referenceId: referenceId,
        });

        await this.repository.createRequest({
          customerId: customerId,
          amount: amount,
          referenceId: referenceId,
          freezeId: frozen.freezeId,
          destination: destination,
          type: type,
        });
      }
    });
  }

  async markAsPaid(id: string, receiptText: string) {
    await this.tx.run(async () => {
      const settlementRequest = await this.repository.getOrThrow(id);
      await this.repository.markPaid(id, receiptText);

      if (settlementRequest.type === "withdrawal")
        await this.wallet.commitFrozen({
          freezeId: settlementRequest.freezeId,
          referenceId: settlementRequest.referenceId,
        });
    });
  }

  async reject(id: string, reason: string) {
    await this.tx.run(async () => {
      const settlementRequest = await this.repository.getOrThrow(id);

      if (settlementRequest.type === "withdrawal")
        await this.wallet.releaseFrozen({
          freezeId: settlementRequest.freezeId,
          reason: "withdrawal-request",
        });

      await this.repository.markRejected(id, reason);
    });
  }
}

import {
  CashbackError,
  InsufficientCashbackBalanceError,
  type CashbackApi,
} from '@feature/cashback-api';
import { type CatalogApi } from '@feature/catalog-api';
import {
  AppliedDiscount,
  InvoiceItem,
  InvoiceItemBase,
  InvoiceSnapshot,
  LineItems,
  Money,
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { type DiscountApi } from '@feature/discount-api';
import { PlanPaymentRequest, type PaymentApi } from '@feature/payment-api';
import { type PricingApi } from '@feature/pricing-api';
import {
  ReturnSnapshot,
  SaleRecordedEventPayload,
  SaleRecordedEventType,
  SaleReturnRecordedEventPayload,
  SaleReturnRecordedEventType,
} from '@feature/sale-api';
import { type SettlementApi } from '@feature/settlement-api';
import { type TaxApi } from '@feature/tax-api';
import { type WalletApi } from '@feature/wallet-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { DuplicateItemsInReturnError } from 'errors/duplicate-items-in-return.error';
import { DuplicateItemsInSaleError } from 'errors/duplicate-items-in-sale.error';
import { ReturnItemsDoNotMatchSaleError } from 'errors/return-items-do-not-match-sale.error';
import { type ReturnRepository } from 'repository/return.repository';
import { type SaleRepository } from 'repository/sale.repository';
import { ProductLineItem } from 'types/product-line-item.type';
import { flattenInvoiceItems } from 'utils/flatten-invoice-item';
import { flattenRefundableItems } from 'utils/flatten-refundable-items';
import { mapProductToUnpricedInvoiceItem } from 'utils/product-to-unpriced-invoice-item.mapper';
import { RecordReturnRequest, RecordSaleRequest } from './sale.requests';
import { RecordReturnResponse } from './sale.responses';

/**
 *
 */
@Injectable()
export class SaleService {
  constructor(
    private readonly returnRepository: ReturnRepository,
    private readonly saleRepository: SaleRepository,
    private readonly warehouse: WarehouseApi,
    private readonly pricing: PricingApi,
    private readonly payment: PaymentApi,
    private readonly discount: DiscountApi,
    private readonly cashback: CashbackApi,
    private readonly settlement: SettlementApi,
    private readonly wallet: WalletApi,
    private readonly catalog: CatalogApi,
    private readonly tax: TaxApi,
    private readonly outboxRepository: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {}

  /**
   * @throws {DuplicateItemsInReturnError}
   * @throws {ReturnItemsDoNotMatchSaleError}
   * @throws {InsufficientCashbackBalanceError}
   * @throws {CashbackError}
   */
  async recordReturn({
    saleId,
    cashbackReversalPolicy,
    items,
    payoff,
  }: RecordReturnRequest): Promise<RecordReturnResponse> {
    // Added transactional handling for the return workflow.
    // Currently, a failure while recording the return document after stock restoration
    // can leave the system in an inconsistent state (stock updated but return not recorded).
    return await this.tx.run(async () => {
      const sale = await this.saleRepository.findById(saleId);

      items.assertUniqueBy(
        (item) => item.productId,
        (productId) => new DuplicateItemsInReturnError(productId),
      );

      const returnItems = items.toLineItems((item) => item.productId);

      const soldItems = sale.snapshot.items;

      const returnSnapshotItems = returnItems.transform(
        (item) => this.computeRefundableLine(soldItems, item),
        (item) => item.productId,
      );

      const refund = returnSnapshotItems.reduce(
        (total, item) => total.add(item.lineTotal),
        Money.zero(),
      );

      const { customer } = sale.snapshot.header;

      let payableRefund: Money = refund;
      let cashbackReversed = Money.zero();
      if (customer && sale.snapshot.summary.cashback) {
        if (!cashbackReversalPolicy) {
          throw new Error('Cashback reversal policy is required.');
        }
        const result = await this.cashback.processCashbackReversal({
          customer,
          refundedItems: returnSnapshotItems,
          referenceId: sale.id,
          granted: sale.snapshot.summary.cashback,
          policy: cashbackReversalPolicy,
        });

        switch (result.kind) {
          case 'deduct_from_refund':
            payableRefund = payableRefund.subtract(result.deductedAmount);
            break;
          case 'reversed':
            cashbackReversed = result.reversedAmount;
            break;
        }
      }

      // Tax
      if (sale.snapshot.summary.tax) {
        const refundableTax = this.calculateProportionalTax(
          sale.snapshot.summary.tax,
          refund,
          sale.snapshot.summary.grandTotal,
        );

        payableRefund = payableRefund.subtract(refundableTax);
      }

      if (payableRefund.lt(Money.zero())) {
        throw new Error('Payable refund cannot be negative.');
      }

      const returnSnapshot: ReturnSnapshot = {
        header: sale.snapshot.header,

        items: returnSnapshotItems,

        summary: {
          refund,
          payableRefund,
        },

        refund: {
          amount: payableRefund,
          cashbackReversed,
        },
      };

      const { returnId } = await this.returnRepository.recordReturn(returnSnapshot);

      // Settlement
      if (payoff) {
        // Payoff
        await this.settlement.refund({
          customerId: customer?.id,
          amount: returnSnapshot.summary.payableRefund,
          destination: payoff.depositTo,
          referenceId: returnId,
        });
      } else {
        // Credit
        if (!customer) throw new Error('...');

        await this.wallet.deposit({
          amount: returnSnapshot.summary.payableRefund,
          customerId: customer.id,
          idempotencyKey: `return:${returnId}`,
          reason: 'refund',
          referenceId: returnId,
        });
      }

      // Warehouse: Receipt goods
      await this.warehouse.issueGoods({
        items: returnSnapshotItems.transform(
          (item) => ({
            goodId: item.productId,
            quantity: item.quantity,
          }),
          (item) => item.goodId,
        ),
      });

      await this.outboxRepository.save({
        type: SaleReturnRecordedEventType,
        payload: {
          snapshot: returnSnapshot,
        } satisfies SaleReturnRecordedEventPayload,
      });

      return {
        returnId: returnId,
      };
    });
  }

  /**
   *
   *
   * @param input
   */
  async recordSale(req: RecordSaleRequest) {
    await this.tx.run(async () => {
      // Uniqueness validation
      req.items.assertUniqueBy(
        (x) => x.productId,
        (key) => new DuplicateItemsInSaleError(key),
      );

      const requestedItems = req.items.toLineItems((item) => item.productId);

      const { products } = await this.catalog.findMany({ productIds: [...requestedItems.keys()] });

      const unpricedInvoiceItems = products.transform(
        (product) =>
          mapProductToUnpricedInvoiceItem(product, requestedItems.getOrThrow(product.id).qty),
        (product) => product.productId,
      );

      // Pricing invoice
      const { pricedInvoice: invoice } = await this.pricing.priceInvoice({
        customer: req.customer,
        items: unpricedInvoiceItems,
      });

      // Processing payment
      const paymentRequest: PlanPaymentRequest = req.customer?.id
        ? {
            customerId: req.customer?.id,
            amountDue: invoice.summary.grandTotal,
            useWallet: req.useWallet,
          }
        : {
            amountDue: invoice.summary.grandTotal,
          };

      const { payment } = await this.payment.planPayment(paymentRequest);

      // Tax
      const { tax } = await this.tax.calculateTax({
        paymentAmount: invoice.summary.grandTotal,
      });

      // Issuing goods
      const flattenedItems = flattenInvoiceItems(invoice.items);
      await this.warehouse.issueGoods({
        items: flattenedItems.transform(
          (item) => ({ goodId: item.productId, quantity: item.quantity }),
          (item) => item.goodId,
        ),
      });

      // Calculating granting cashback customer for preview
      const { cashback: cashbackPreview } = req.customer
        ? await this.cashback.calculate({
            customer: req.customer,
            purchasedItems: invoice.items,
          })
        : { cashback: undefined };

      const snapshot: InvoiceSnapshot = {
        header: {
          cashierId: req.cashierId,
          customer: req.customer,
          issuedAt: new Date(Date.now()),
        },
        items: invoice.items,
        summary: { ...invoice.summary, cashback: cashbackPreview, tax },
        payment,
      };

      const { saleId } = await this.saleRepository.recordSale(snapshot);

      if (req.customer?.id)
        await this.cashback.grant({
          customer: req.customer,
          purchasedItems: invoice.items,
          referenceId: saleId,
          expectedCashback: cashbackPreview!,
        });

      // Commit discount usages
      if (req.customer) {
        const appliedDiscounts = snapshot.items.reduce(
          (discounted, item) => {
            if (!item.discount) return discounted;

            return discounted.set(item.discount);
          },
          new LineItems<AppliedDiscount>((x) => x.source.id),
        );

        await this.discount.commitDiscountUsages({
          customer: req.customer,
          appliedDiscounts,
        });
      }

      await this.outboxRepository.save({
        type: SaleRecordedEventType,
        payload: {
          snapshot,
        } satisfies SaleRecordedEventPayload,
      });
    });
  }

  private calculateProportionalTax(tax: Money, refund: Money, invoiceTotal: Money): Money {
    const ratio = refund.value / invoiceTotal.value;

    return tax.multiply(ratio);
  }

  private computeRefund(
    returnItems: LineItems<ProductLineItem>,
    soldItems: LineItems<InvoiceItem>,
  ): Money {
    const refundableItems = flattenRefundableItems(soldItems);

    let refund = Money.zero();

    for (const returnItem of returnItems) {
      const refundableItem = refundableItems.getOrThrow(
        returnItem.productId,
        () => new ReturnItemsDoNotMatchSaleError(),
      );

      if (returnItem.quantity > refundableItem.quantity) throw new ReturnItemsDoNotMatchSaleError();

      // Discount given is considered
      refund = refund.add(
        refundableItem.lineTotal.divide(refundableItem.quantity).multiply(returnItem.quantity),
      );
    }
    return refund;
  }

  private computeRefundableLine(
    soldItems: LineItems<InvoiceItem>,
    item: ProductLineItem,
  ): InvoiceItemBase {
    const refundableItem = flattenRefundableItems(soldItems).getOrThrow(
      item.productId,
      () => new ReturnItemsDoNotMatchSaleError(),
    );

    if (item.quantity > refundableItem.quantity) {
      throw new ReturnItemsDoNotMatchSaleError();
    }

    return {
      ...item,
      description: refundableItem.description,
      unitPrice: refundableItem.unitPrice,
      lineTotal: refundableItem.lineTotal.divide(refundableItem.quantity).multiply(item.quantity),
    };
  }
}

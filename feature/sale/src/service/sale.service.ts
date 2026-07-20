import {
  CashbackError,
  InsufficientCashbackBalanceError,
  type CashbackApi,
} from "@feature/cashback-api";
import {
  AppliedDiscount,
  InvoiceItem,
  InvoiceItemBase,
  InvoiceSnapshot,
  LineItems,
  Money,
  type OutboxRepository,
  type TransactionManager,
} from "@feature/common";
import { type DiscountApi } from "@feature/discount-api";
import { type PaymentApi } from "@feature/payment-api";
import { type PricingApi } from "@feature/pricing-api";
import {
  ReturnSnapshot,
  SaleRecordedEventPayload,
  SaleRecordedEventType,
  SaleReturnRecordedEventPayload,
  SaleReturnRecordedEventType,
} from "@feature/sale-api";
import { type TaxApi } from "@feature/tax-api";
import { type WarehouseApi } from "@feature/warehouse-api";
import { Injectable } from "@nestjs/common";
import { DuplicateItemsInReturnError } from "errors/duplicate-items-in-return.error";
import { DuplicateItemsInSaleError } from "errors/duplicate-items-in-sale.error";
import { ReturnItemsDoNotMatchSaleError } from "errors/return-items-do-not-match-sale.error";
import { type ProductQuery } from "port/product-query.port";
import { type SaleDocumentsRepository } from "repository/sale-documents.repository";
import { type SaleReturnDocumentsRepository } from "repository/sale-return-documents.repository";
import { ProductLineItem } from "types/product-line-item.type";
import { flattenInvoiceItems } from "utils/flatten-invoice-item";
import { flattenRefundableItems } from "utils/flatten-refundable-items";
import { mapProductToUnpricedInvoiceItem } from "utils/product-to-unpriced-invoice-item.mapper";
import { RecordReturnRequest, RecordSaleRequest } from "./sale.requests";
import { RecordReturnResponse } from "./sale.responses";

/**
 *
 */
@Injectable()
export class SaleService {
  constructor(
    private readonly saleReturnDocumentsRepository: SaleReturnDocumentsRepository,
    private readonly saleDocumentsRepository: SaleDocumentsRepository,
    private readonly productQuery: ProductQuery,
    private readonly warehouse: WarehouseApi,
    private readonly pricing: PricingApi,
    private readonly payment: PaymentApi,
    private readonly discount: DiscountApi,
    private readonly cashback: CashbackApi,
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
  }: RecordReturnRequest): Promise<RecordReturnResponse> {
    // Added transactional handling for the return workflow.
    // Currently, a failure while recording the return document after stock restoration
    // can leave the system in an inconsistent state (stock updated but return not recorded).
    return await this.tx.run(async () => {
      const sale = await this.saleDocumentsRepository.findById(saleId);

      items.assertUniqueBy(
        (item) => item.productId,
        (productId) => new DuplicateItemsInReturnError(productId),
      );

      const returnItems = items.toLineItems((item) => item.productId);

      const soldItems = sale.snapshot.items;

      const returnDocumentItems = returnItems.transform(
        (item) => this.computeRefundableLine(soldItems, item),
        (item) => item.productId,
      );

      const refund = returnDocumentItems.reduce(
        (total, item) => total.add(item.lineTotal),
        Money.zero(),
      );

      const { customerId } = sale.snapshot.header;

      let payableRefund =
        customerId && sale.snapshot.summary.cashback
          ? (
              await this.cashback.processCashbackReversal({
                customerId,
                refundAmount: refund,
                referenceId: sale.id,
                granted: sale.snapshot.summary.cashback,
                policy: cashbackReversalPolicy!,
              })
            ).payableRefund
          : refund;

      await this.warehouse.recordGoodsReceipt({
        items: returnDocumentItems.transform(
          (item) => ({
            goodId: item.productId,
            quantity: item.quantity,
          }),
          (item) => item.goodId,
        ),
      });

      // Tax
      if (sale.snapshot.summary.tax) {
        const taxRefund = this.calculateProportionalTax(
          sale.snapshot.summary.tax,
          refund,
          sale.snapshot.summary.grandTotal,
        );

        payableRefund = payableRefund.subtract(taxRefund);
      }

      const returnDocument: ReturnSnapshot = {
        header: sale.snapshot.header,

        items: returnDocumentItems,

        summary: {
          refund,
          payableRefund,
        },

        refund: {
          amount: payableRefund,
          cashbackReversed: refund.subtract(payableRefund),
        },
      };

      await this.saleReturnDocumentsRepository.recordReturn(returnDocument);

      await this.outboxRepository.save({
        type: SaleReturnRecordedEventType,
        payload: {
          snapshot: returnDocument,
        } satisfies SaleReturnRecordedEventPayload,
      });

      return {
        payableRefund,
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

      const products = await this.productQuery.findMany([
        ...requestedItems.keys(),
      ]);

      const unpricedInvoiceItems = products.transform(
        (product) =>
          mapProductToUnpricedInvoiceItem(
            product,
            requestedItems.getOrThrow(product.id).qty,
          ),
        (product) => product.productId,
      );

      // Pricing invoice
      const { pricedInvoice: invoice } = await this.pricing.priceInvoice(
        {
          customerId: req.cashierId,
          items: unpricedInvoiceItems,
        },
      );

      // Processing payment
      const { payment } = req.customerId
        ? await this.payment.planPayment({
            amountDue: invoice.summary.grandTotal,
            customerId: req.customerId,
            useWallet: req.useWallet, //TODO Change the contract of the method request api
            externalPaymentMethod: "posTerminal",
          })
        : {
            payment: {
              externalPayment: {
                amount: invoice.summary.subtotal,
                paymentMethod: "posTerminal",
              },
            },
          };

      // Tax
      const { tax } = await this.tax.calculateTax({
        paymentAmount: invoice.summary.grandTotal,
      });

      // Issuing goods
      const flattenedItems = flattenInvoiceItems(invoice.items);
      await this.warehouse.recordGoodsIssue({
        items: flattenedItems.transform(
          (item) => ({ goodId: item.productId, quantity: item.quantity }),
          (item) => item.goodId,
        ),
      });

      // Granting cashback customer for purchase
      // TODO Extract the cashback calculator and grant after sale recorded and pass the referenceId(saleId)
      const { grantedCashback } = req.customerId
        ? await this.cashback.grantCashback({
            customerId: req.customerId,
            referenceId: 
            purchaseAmount: invoice.summary.grandTotal,
          })
        : { grantedCashback: undefined };

      const snapshot: InvoiceSnapshot = {
        header: {
          cashierId: req.cashierId,
          customerId: req.customerId,
          issuedAt: new Date(Date.now()),
        },
        items: invoice.items,
        summary: { ...invoice.summary, cashback: grantedCashback, tax },
        payment,
      };

      await this.saleDocumentsRepository.recordSale(snapshot);

      // Commit discount usages
      if (req.customerId) {
        const appliedDiscounts = snapshot.items.reduce(
          (discounted, item) => {
            if (!item.discount) return discounted;

            return discounted.set(item.discount);
          },
          new LineItems<AppliedDiscount>((x) => x.source.id),
        );

        await this.discount.commitDiscountUsages({
          customerId: req.customerId,
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

  private calculateProportionalTax(
    tax: Money,
    refund: Money,
    invoiceTotal: Money,
  ): Money {
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

      if (returnItem.quantity > refundableItem.quantity)
        throw new ReturnItemsDoNotMatchSaleError();

      // Discount given is considered
      refund = refund.add(
        refundableItem.lineTotal
          .divide(refundableItem.quantity)
          .multiply(returnItem.quantity),
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
      lineTotal: refundableItem.lineTotal
        .divide(refundableItem.quantity)
        .multiply(item.quantity),
    };
  }
}

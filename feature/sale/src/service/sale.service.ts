import {
  CashbackError,
  type ICashbackService,
  InsufficientCashbackBalanceError,
} from "@feature/cashback-api";
import {
  InvoiceItem,
  InvoiceItemBase,
  InvoiceSnapshot,
  LineItems,
  Money,
} from "@feature/common";
import { type IPaymentService } from "@feature/payment-api";
import { type IPricingService } from "@feature/pricing-api";
import { type IWarehouseService } from "@feature/warehouse-api";
import { Injectable } from "@nestjs/common";
import { DuplicateItemsInReturnError } from "errors/duplicate-items-in-return.error";
import { DuplicateItemsInSaleError } from "errors/duplicate-items-in-sale.error";
import { ReturnItemsDoNotMatchSaleError } from "errors/return-items-do-not-match-sale.error";
import { ReturnSnapshot } from "model/sale-return";
import { type IProductQuery } from "port/product-query.port";
import { type ISaleDocumentsRepository } from "repository/sale-documents.repository";
import { ProductLineItem } from "types/product-line-item.type";
import { flattenInvoiceItems } from "utils/flatten-invoice-item";
import { flattenRefundableItems } from "utils/flatten-refundable-items";
import { mapProductToUnpricedInvoiceItem } from "utils/product-to-unpriced-invoice-item.mapper";
import { RecordReturnRequest, RecordSaleRequest } from "./sale.requests";
import { RecordReturnResponse } from "./sale.responses";
import { type IOutboxRepository } from "@feature/common";
import {
  SaleRecordedEventPayload,
  SaleRecordedEventType,
  SaleReturnRecordedEventPayload,
  SaleReturnRecordedEventType,
} from "@feature/sale-api";

/**
 *
 */
@Injectable()
export class SaleService {
  constructor(
    private readonly saleDocumentsRepository: ISaleDocumentsRepository,
    private readonly productQuery: IProductQuery,
    private readonly warehouseService: IWarehouseService,
    private readonly pricingService: IPricingService,
    private readonly paymentService: IPaymentService,
    private readonly cashbackService: ICashbackService,
    private readonly outboxRepository: IOutboxRepository,
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
    // TODO: Add transactional handling for the return workflow.
    // Currently, a failure while recording the return document after stock restoration
    // can leave the system in an inconsistent state (stock updated but return not recorded).
    const sale = await this.saleDocumentsRepository.findSaleById(saleId);

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

    const payableRefund = customerId
      ? (
          await this.cashbackService.processCashbackReversal({
            customerId,
            refund,
            policy: cashbackReversalPolicy!,
          })
        ).payableRefund
      : refund;

    await this.warehouseService.recordGoodsReceipt({
      items: returnDocumentItems.transform(
        (item) => ({
          goodId: item.productId,
          quantity: item.quantity,
        }),
        (item) => item.goodId,
      ),
    });

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

    const { saleReturnId } =
      await this.saleDocumentsRepository.recordReturn(returnDocument);

    await this.outboxRepository.save({
      type: SaleReturnRecordedEventType,
      payload: {
        TODO: "Define the event payload type",
      } satisfies SaleReturnRecordedEventPayload,
    });

    return {
      payableRefund,
    };
  }
  /**
   *
   *
   * @param input
   */
  async recordSale(req: RecordSaleRequest) {
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
    const { pricedInvoice: invoice } = await this.pricingService.priceInvoice({
      customerId: req.cashierId,
      items: unpricedInvoiceItems,
    });

    // Processing payment
    const { payment } = req.customerId
      ? await this.paymentService.planPayment({
          amountDue: invoice.summary.grandTotal,
          customerId: req.customerId,
          useWallet: req.useWallet,
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

    // Issuing goods
    const flattenedItems = flattenInvoiceItems(invoice.items);
    await this.warehouseService.recordGoodsIssue({
      items: flattenedItems.transform(
        (item) => ({ goodId: item.productId, quantity: item.quantity }),
        (item) => item.goodId,
      ),
    });

    // Granting cashback customer for purchase
    const { grantedCashback } = req.customerId
      ? await this.cashbackService.grantCashback({
          customerId: req.customerId,
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
      summary: { ...invoice.summary, cashback: grantedCashback },
      payment,
    };

    await this.saleDocumentsRepository.recordSale(snapshot);

    await this.outboxRepository.save({
      type: SaleRecordedEventType,
      payload: {
        snapshot,
      } satisfies SaleRecordedEventPayload,
    });

    // TODO: Make this flow steps as transactional and has ability to rollback any changes made to aggregate
    // TODO: transaction:(warehouse issue + saving sale record + cashback + outbox)
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

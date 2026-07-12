import {
  type ICashbackService,
  InsufficientCashbackBalanceError,
  CashbackError,
} from "@feature/cashback-api";
import {
  InvoiceItem,
  InvoiceSnapshot,
  LineItems,
  Money,
  Payment,
} from "@feature/common";
import { type ICustomersService } from "@feature/customer-api";
import { type IPaymentService } from "@feature/payment-api";
import { type IPricingService } from "@feature/pricing-api";
import { type IWarehouseService } from "@feature/warehouse-api";
import { Injectable } from "@nestjs/common";
import { type ISaleDocumentsRepository } from "repository/sale-documents.repository";
import { RecordReturnRequest, RecordSaleRequest } from "./sale.requests";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SaleRecordedEvent } from "@feature/sale-api";
import { DuplicateItemsInReturnError } from "errors/duplicate-items-in-return.error";
import { Sale, SaleInvoice, SaleItem } from "model/sale";
import { ReturnItemsDoNotMatchSaleError } from "errors/return-items-do-not-match-sale.error";
import { RecordReturnResponse } from "./sale.responses";
import { DuplicateItemsInSaleError } from "errors/duplicate-items-in-sale.error";
import { ProductLineItem } from "types/prodcut-line-item.type";

/**
 *
 */
@Injectable()
export class SaleService {
  constructor(
    private readonly saleDocumentsRepository: ISaleDocumentsRepository,
    private readonly warehouseService: IWarehouseService,
    private readonly pricingService: IPricingService,
    private readonly paymentService: IPaymentService,
    private readonly cashbackService: ICashbackService,
    private readonly customersService: ICustomersService,
    private readonly eventEmitter: EventEmitter2,
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
    const sale = await this.saleDocumentsRepository.findSaleById(saleId);

    // Prevent duplications
    items.assertUniqueBy(
      (item) => item.productId,
      (productId) => new DuplicateItemsInReturnError(productId),
    );

    // Calculate payable refund

    const returnItems = items.toLineItems((item) => item.productId);
    const soldItems = sale.snapshot.items;

    const refund = this.computeRefund(returnItems, soldItems);

    // Reverse cashback
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

    // TODO Receipt goods in warehouse
    await this.warehouseService.recordGoodsReceipt({
      items: items,
    });
    // TODO Record the return document, (remember that cant be an invoice)
    return { payableRefund };
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

    // Resolving customer type
    const { customerType } = (req.customerId &&
      (await this.customersService.resolveCustomerType({
        customerId: req.customerId,
      }))) || { customerType: "consumer" };

    // Pricing invoice
    const { policy } = this.pricingService.getPricingPolicy({ customerType });
    const {
      pricedInvoice: { items, summary },
    } = await this.pricingService.priceInvoice({
      items: req.items.toLineItems((item) => item.productId),
      policy,
    });

    // Processing payment
    const { payment } = req.customerId
      ? await this.paymentService.planPayment({
          amountDue: summary.grandTotal,
          customerId: req.customerId,
          useWallet: req.useWallet,
          externalPaymentMethod: "posTerminal",
        })
      : {
          payment: {
            externalPayment: {
              amount: summary.subtotal,
              paymentMethod: "posTerminal",
            },
          },
        };

    // Issuing goods
    await this.warehouseService.recordGoodsIssue({
      items: items.transform(
        (item) => ({
          goodId: item.productId,
          qty: item.quantity,
        }),
        (item) => item.goodId,
      ),
    });

    const { saleId } = await this.saleDocumentsRepository.recordSale({
      header: {
        cashierId: req.cashierId,
        customerId: req.customerId,
        issuedAt: new Date(Date.now()),
      },
      items,
      summary,
      payment,
    });

    this.eventEmitter.emit("pos.sale-recorded", new SaleRecordedEvent(saleId));
  }

  private computeRefund(
    returnItems: LineItems<ProductLineItem>,
    soldItems: LineItems<InvoiceItem>,
  ) {
    let refund = Money.zero();
    for (const returnItem of returnItems) {
      const saleItem = soldItems.get(returnItem.productId);

      // Validate items matching
      if (!saleItem) throw new ReturnItemsDoNotMatchSaleError();
      if (returnItem.quantity > saleItem.quantity)
        throw new ReturnItemsDoNotMatchSaleError();

      const lineTotalWithoutDiscount = saleItem.unitPrice.multiply(
        returnItem.quantity,
      );
      const lineTotal =
        saleItem.discount === undefined
          ? lineTotalWithoutDiscount
          : lineTotalWithoutDiscount.subtract(saleItem.discount);

      refund = refund.add(lineTotal);
    }

    return refund;
  }
}

import { type ICashbackService } from "@feature/cashback-api";
import { Payment } from "@feature/common";
import { type ICustomersService } from "@feature/customer-api";
import { type IPaymentService } from "@feature/payment-api";
import { type IPricingService } from "@feature/pricing-api";
import { type IWarehouseService } from "@feature/warehouse-api";
import { Injectable } from "@nestjs/common";
import { type ISaleDocumentsRepository } from "repository/sale-documents.repository";
import { RecordReturnRequest, RecordSaleRequest } from "./sale.requests";
import { EventEmitter2 } from "@nestjs/event-emitter";

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
   * Considerations:
   *     */
  async recordReturn({
    saleId,
    discardCashbackReversal,
    items,
  }: RecordReturnRequest) {
    const sale = await this.saleDocumentsRepository.findSaleById(saleId);

    // Reverse Cashback
    if (!discardCashbackReversal) {
      const grandTotal = this.cashbackService.reverseCashback(sale);
    }
    // Receipt goods in warehouse
    // Record the return document, (remember that cant be an invoice)
  }

  /**
   *
   * @param input
   */
  async recordSale(request: RecordSaleRequest) {
    const ids = request.items.map((item) => item.productId);
    const { cashierId, customerId, useWallet } = request;

    const quantities = request.items.reduce<Map<string, number>>(
      (prev, curr) => {
        prev[curr.productId] = curr.quantity;
        return prev;
      },
      new Map(),
    );

    // Resolving customer type
    const { customerType } = (customerId &&
      (await this.customersService.resolveCustomerType({
        customerId: customerId,
      }))) || { customerType: "consumer" };

    // Pricing items and other invoices props
    const { policy } = this.pricingService.getPricingPolicy({
      customerType,
    });

    const { sale } = await this.pricingService.priceSale({
      items: ids.map((id) => ({
        productId: id,
        quantity: quantities[id],
      })),
      policy,
    });

    // Processing payment
    const { payment }: { payment: Payment } = customerId
      ? await this.paymentService.planPayment({
          amountDue: sale.summary.grandTotal,
          customerId,
          useWallet,
          externalPaymentMethod: "posTerminal",
        })
      : {
          payment: {
            externalPayment: {
              amount: sale.summary.subtotal,
              paymentMethod: "posTerminal",
            },
          },
        };

    // Issuing goods
    await this.warehouseService.recordGoodsIssue({
      items: sale.items.map((item) => ({
        goodId: item.productId,
        quantity: item.quantity,
      })),
    });

    const { saleId } = await this.saleDocumentsRepository.recordSale({
      ...sale,
      header: {
        cashierId,
        issuedAt: new Date(Date.now()),
        customerId,
      },
      summary: {
        ...sale.summary,
      },
      payment,
    });

    this.eventEmitter.emit("pos.sale-recorded", new SaleRecordedEvent(saleId));
  }
}

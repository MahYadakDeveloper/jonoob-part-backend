import { type ICashbackService } from "@feature/cashback-api";
import { Invoice, Payment } from "@feature/common";
import { type IPaymentService } from "@feature/payment-api";
import { type IPricingService } from "@feature/pricing-api";
import { type IWarehouseService } from "@feature/warehouse-api";
import { Injectable } from "@nestjs/common";
import { type ISaleDocumentsRepository } from "repository/sale-documents.repository";
import { RecordSaleInput } from "./dto/record-sale.dto";
import { RecordReturnInput } from "./dto/record-return.dto";
import { type ICustomersRepository } from "repository/customer.repository";

/**
 *
 */
@Injectable()
export class PosService {
  constructor(
    private readonly saleDocumentsRepository: ISaleDocumentsRepository,
    private readonly customersRepository: ICustomersRepository,
    private readonly warehouseService: IWarehouseService,
    private readonly pricingService: IPricingService,
    private readonly paymentService: IPaymentService,
    private readonly cashbackService: ICashbackService,
  ) {}

  /**
   * Considerations:
   *  - if discardCashbackReversal is false | undefined then calculate the cashback and reduce from user wallet
   *  if cashback is allocated.[if it the cashback fails throw an error and do not proceed].
   *
   * Workflow:
   *  - cashback
   *  - receipt goods in warehouse
   *  - record the return document, (remember that cant be an invoice)
   */
  async recordReturn(input: RecordReturnInput) {}

  /**
   *
   * @param input
   */
  async recordSale(input: RecordSaleInput) {
    const ids = input.items.map((item) => item.productId);
    const { cashierId, customerId, useWallet } = input;

    const customerType =
      (customerId &&
        this.customersRepository.getCustomerTypeById(customerId)) ||
      "consumer";

    const quantities = input.items.reduce<Map<string, number>>((prev, curr) => {
      prev[curr.productId] = curr.quantity;
      return prev;
    }, new Map());

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

    // Granting cashback
    const { cashback } = (customerId &&
      (await this.cashbackService.grantCashback({
        customerId,
        purchasedItems: sale.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }))) || { cashback: undefined };

    await this.saleDocumentsRepository.recordSale({
      ...sale,
      header: {
        cashierId,
        issuedAt: new Date(Date.now()),
        customerId,
      },
      summary: {
        ...sale.summary,
        cashback,
      },
      payment,
    });
  }
}

import { type ICashbackService } from "@feature/cashback-api";
import { Invoice, Payment } from "@feature/common";
import { type IPaymentService } from "@feature/payment-api";
import { type IPricingService } from "@feature/pricing-api";
import { type IWarehouseService } from "@feature/warehouse-api";
import { Injectable } from "@nestjs/common";
import { type ISaleDocumentsRepository } from "repository/sale-documents.repository";
import { RecordSaleInput } from "./dto/record-sale.dto";

@Injectable()
export class PosService {
  constructor(
    private readonly saleDocumentsRepository: ISaleDocumentsRepository,
    private readonly customersRepository: CustomersRepository,
    // private readonly synchronizer: Synchronizer,
    private readonly warehouseService: IWarehouseService,
    private readonly pricingService: IPricingService,
    private readonly paymentService: IPaymentService,
    private readonly cashbackService: ICashbackService,
  ) {}

  /**
   *
   * @throws {ProductWithNoPriceFound} this error thrown when an item in the list has no price.
   */
  async recordSale(input: RecordSaleInput) {
    const ids = input.items.map((item) => item.productId);
    const { cashierId, customerId, wallet } = input;

    const customerType =
      this.customersRepository.getCustomerTypeById(customerId);

    const quantities = input.items.reduce<Record<string, number>>(
      (prev, curr) => {
        prev[curr.productId] = curr.quantity;
        return prev;
      },
      {},
    );

    const { unitOfMeasures } =
      await this.warehouseService.getUnitOfMeasuresOfProducts({
        productIds: ids,
      });

    // Pricing items and other invoices props
    const { policy } = this.pricingService.getPricingPolicy({
      customerType,
    });

    const { invoice: pricedInvoiced } = await this.pricingService.priceInvoice({
      items: ids.map((id) => ({
        productId: id,
        quantity: quantities[id],
        unitOfMeasure: unitOfMeasures[id],
      })),
      policy,
    });

    // Processing payment
    const { payment }: { payment: Payment } = customerId
      ? await this.paymentService.planPayment({
          amountDue: pricedInvoiced.summary.grandTotal,
          customerId,
          wallet,
          externalPaymentMethod: "posTerminal",
        })
      : {
          payment: {
            externalPayment: {
              amount: pricedInvoiced.summary.subtotal,
              paymentMethod: "posTerminal",
            },
          },
        };

    // Issuing goods
    await this.warehouseService.recordGoodsIssue({
      items: pricedInvoiced.items.map((item) => ({
        goodsId: item.productId,
        quantity: item.quantity,
      })),
    });

    // Granting cashback
    const { cashback } = (customerId &&
      (await this.cashbackService.grantCashback({
        customerId,
        purchasedItems: pricedInvoiced.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }))) || { cashback: undefined };

    const invoice: Invoice = {
      ...pricedInvoiced,
      header: {
        cashierId,
        issuedAt: new Date(Date.now()),
        customerId,
      },
      summary: {
        ...pricedInvoiced.summary,
        cashback,
      },
      payment,
    };

    await this.saleDocumentsRepository.recordInvoice(invoice);
  }
}

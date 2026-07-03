import { Invoice, Money, Payment } from "@feature/common";
import { PricingPolicy, type IPricingService } from "@feature/pricing-api";
import { type WarehouseService } from "@feature/warehouse-api";
import { type IWalletService } from "@feature/wallet-api";
import { Injectable } from "@nestjs/common";
import { RecordSaleInput } from "./dto/record-sale.dto";
import { type IPaymentService } from "@feature/payment-api";

@Injectable()
export class PosService {
  constructor(
    private readonly saleDocumentsRepository: SaleDocumentsRepository,
    private readonly customersRepository: CustomersRepository,
    // private readonly synchronizer: Synchronizer,
    private readonly warehouseService: WarehouseService,
    private readonly pricingService: IPricingService,
    private readonly walletService: IWalletService,
    private readonly paymentService: IPaymentService,
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

    const { payment } = await this.paymentService.planPayment({
      amountDue: pricedInvoiced.summary.grandTotal,
      customerId,
      wallet,
      externalPaymentMethod: "posTerminal",
    });

    const invoice: Invoice = {
      ...pricedInvoiced,
      header: {
        cashierId,
        issuedAt: new Date(Date.now()),
        customerId,
      },
      summary: {
        ...pricedInvoiced.summary,
        // reward
        // discount
      },
      payment,
    };

    // Update inventory state

    // Adding items into invoice
    // See which has discount [DiscountService]
  }
}

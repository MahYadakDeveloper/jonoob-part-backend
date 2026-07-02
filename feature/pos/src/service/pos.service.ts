import { Invoice } from "@feature/common";
import { PricingPolicy, type IPricingService } from "@feature/pricing-api";
import { type WarehouseService } from "@feature/warehouse-api";
import { Injectable } from "@nestjs/common";
import { RecordSaleInput } from "./dto/record-sale.dto";

@Injectable()
export class PosService {
  constructor(
    private readonly saleDocumentsRepository: SaleDocumentsRepository,
    private readonly customersRepository: CustomersRepository,
    // private readonly synchronizer: Synchronizer,
    private readonly warehouseService: WarehouseService,
    private readonly pricingService: IPricingService,
  ) {}

  /**
   *
   * @throws {ProductWithNoPriceFound} this error thrown when an item in the list has no price.
   */
  async recordSale(input: RecordSaleInput) {
    const ids = input.items.map((item) => item.productId);
    const { cashierId } = input;

    const customerType =
      (input.customer?.id &&
        this.customersRepository.getCustomerTypeById(input.customer.id)) ||
      "consumer";

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

    const pricingPolicy: PricingPolicy =
      customerType === "merchant" ? "wholesale" : "retail";

    const { invoice: pricedInvoiced } = await this.pricingService.priceInvoice({
      items: ids.map((id) => ({
        productId: id,
        quantity: quantities[id],
        unitOfMeasure: unitOfMeasures[id],
      })),
      policy: pricingPolicy,
    });

    const invoice: Invoice = {
      ...pricedInvoiced,
      header: {
        cashierId,
        issuedAt: new Date(Date.now()),
      },
      summary: {
        ...pricedInvoiced.summary,
        // reward
        // discount
      },
    };

    // Update inventory state

    // Adding items into invoice
    // See which has discount [DiscountService]
  }
}

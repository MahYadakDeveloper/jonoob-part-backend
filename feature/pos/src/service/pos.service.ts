import { Injectable } from "@nestjs/common";
import { RecordSaleInput } from "./dto/record-sale.dto";
import { type PricingService } from "@feature/pricing-api";
import { type DiscountService } from "@feature/discount-api";
import { type WarehouseService } from "@feature/warehouse-api";

@Injectable()
export class PosService {
  constructor(
    private readonly saleDocumentsRepository: SaleDocumentsRepository,
    private readonly customersRepository: CustomersRepository,
    // private readonly synchronizer: Synchronizer,
    private readonly warehouseService: WarehouseService,
    private readonly pricingService: PricingService,
    private readonly discountService: DiscountService,
  ) {}

  /**
   *
   * @throws {ProductWithNoPriceFound} this error thrown when an item in the list has no price.
   */
  async recordSale(input: RecordSaleInput) {
    const ids = input.items.map((item) => item.productId);

    // getting discounts of product those has
    const { discounts } = await this.discountService.findApplicableDiscounts({
      items: input.items,
    });

    const customerType =
      (input.customer?.id &&
        this.customersRepository.getCustomerTypeById(input.customer.id)) ||
      "consumer";

    const { prices } = await this.pricingService.priceManyUnit({
      items: input.items,
      customerType,
    });


    const quantities = input.items.reduce<Record<string, number>>(
      (prev, curr) => {
        prev[curr.productId] = curr.quantity;
        return prev;
      },
      {},
    );

    const unitOfMeasures =
      await this.warehouseService.getUnitOfMeasuresByIds(ids);

    // const pricingService: PricingService =
    //   customerType === "merchant"
    //     ? new WholesalePricingService(markup)
    //     : new RetailPricingService(markup);

    // calculate invoice items
    const items = ids.map((id) => {
      const unitOfMeasure = unitOfMeasures[id.getValue()];
      const quantity = quantities[id.getValue()];
      const unitPrice = prices[id.getValue()],
      );
      const discount = discounts[id.getValue()];
      const lineTotal = pricingService.calculateLineTotal(
        unitPrice,
        quantity,
        discount,
      );

      return Item.create({
        productId: id,
        quantity,
        unitOfMeasure,
        unitPrice,
        discount,
        lineTotal,
      });
    });

    const grandTotal = pricingService.calculateGrandTotal(
      items.map((item) => item.lineTotal),
    );
    const subtotal = pricingService.calculateSubtotal(
      items.map((item) => ({ unitPrice: item.unitPrice, qty: item.quantity })),
    );

    const invoice = SaleInvoice.create(
      {
        cashierId: input.cashierId,
        issuedAt: new Date(Date.now()),
        customerId: input.customerId,
      },
      items,
      {
        grandTotal,
        subtotal,
        discount: subtotal.subtract(grandTotal),
      },
      {
        paidWithWalletBalance: new Money(3), //TODO Complete this section
        amountDue: Money.create(0),
      },
    );
    // Update inventory state
    new Money(3).sum(new Money(5));

    // Adding items into invoice
    // See which has discount [DiscountService]
  }
}

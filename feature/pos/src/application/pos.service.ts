import { Quantity } from "@feature/shared";
import { Injectable } from "@nestjs/common";
import { type ICustomerRepository } from "domain/repositories/customer.repository";
import { type IDiscountRepository } from "domain/repositories/discount.repository";
import { type IPurchaseDocumentRepository } from "domain/repositories/purchase-documents.repository";
import { type ISaleDocumentsRepository } from "domain/repositories/sale-documents.repository";
import { type IWarehouseRepository } from "domain/repositories/warehouse.repository";
import { PricingService } from "domain/services/pricing.service";
import { RetailPricingService } from "domain/services/retail-pricing.service";
import { WholesalePricingService } from "domain/services/wholesale-pricing.service";
import { CashierId } from "domain/value-object/cashier-id";
import { CustomerId } from "domain/value-object/customer-id";
import { Item } from "domain/value-object/item";
import { Money } from "domain/value-object/money";
import { SaleInvoice } from "domain/value-object/sale-invoice";
import { ProductId } from "../domain/value-object/product-id";
import { RecordSaleInputDto } from "./dto/record-sale.dto";
import { type IMarkupPolicyProvider } from "./ports/markup-policy.provider";
import { type ISynchronizer } from "./ports/synchronizer";

@Injectable()
export class PosService {
  constructor(
    private readonly purchaseDocumentsRepository: IPurchaseDocumentRepository,
    private readonly saleDocumentsRepository: ISaleDocumentsRepository,
    private readonly discountRepository: IDiscountRepository,
    private readonly warehouseRepository: IWarehouseRepository,
    private readonly markupPolicyProvider: IMarkupPolicyProvider,
    private readonly customerRepository: ICustomerRepository,
    private readonly synchronizer: ISynchronizer,
  ) {}

  /**
   *
   * @throws {ProductWithNoPriceFound} this error thrown when an item in the list has no price.
   */
  async recordSale(inputDto: RecordSaleInputDto) {
    const input = {
      customerId:
        inputDto.customerInfo && CustomerId.create(inputDto.customerInfo?.id),
      cashierId: CashierId.create(inputDto.cashierId),
      items: inputDto.items.map((item) => ({
        productId: ProductId.create(item.productId),
        qty: Quantity.create(item.quantity),
      })),
    };

    const ids = input.items.map((item) => item.productId);

    // getting latest purchase prices of products for pricing for sale
    const purchasePrices =
      await this.purchaseDocumentsRepository.getLatestPurchasePricesOf(ids);

    // getting discounts of product those has
    const discounted = await this.discountRepository.getProductsDiscounts(ids);

    const quantities = input.items.reduce<Record<string, Quantity>>(
      (prev, curr) => {
        prev[curr.productId.getValue()] = curr.qty;
        return prev;
      },
      {},
    );

    const unitOfMeasures =
      await this.warehouseRepository.getUnitOfMeasuresByIds(ids);

    const customerType =
      (input.customerId &&
        this.customerRepository.getCustomerTypeById(input.customerId)) ||
      "consumer";
    const markup = await this.markupPolicyProvider.resolve(customerType);
    const pricingService: PricingService =
      customerType === "merchant"
        ? new WholesalePricingService(markup)
        : new RetailPricingService(markup);

    // calculate invoice items
    const items = ids.map<Item>((id) => {
      const unitOfMeasure = unitOfMeasures[id.getValue()];
      const quantity = quantities[id.getValue()];
      const unitPrice = pricingService.calculateUnit(
        purchasePrices[id.getValue()],
      );
      const discount = discounted[id.getValue()];
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
        paidWithWalletBalance: Money.create(3), //TODO Complete this section
        amountDue: Money.create(0),
      },
    );
    // Update inventory state

    // Adding items into invoice
    // See which has discount [DiscountService]
  }
}

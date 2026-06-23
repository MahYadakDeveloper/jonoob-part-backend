import { Packaging, Quantity } from "@feature/shared";
import { Injectable } from "@nestjs/common";
import { type IDiscountRepository } from "domain/repositories/discount.repository";
import { type IPurchaseDocumentRepository } from "domain/repositories/purchase-documents.repository";
import { type ISaleDocumentsRepository } from "domain/repositories/sale-documents.repository";
import { CashierId } from "domain/value-object/cashier-id";
import { Item } from "domain/value-object/item";
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
    private readonly synchronizer: ISynchronizer,
  ) {}

  /**
   * NOTE: A SALE Invoice
   * {
   *    items: {
   *      productId, qty, baseUnit(piece|pair|set), price(Money),discount(Money)
   *      ,withCreditPayedAmount(Money),totalAmount(Money),AmountDue(Money)
   *    }[],
   *    cashierId: string,
   *    customerId: {...},
   *    recordedAt: Date,
   *    . . .
   * }
   *
   * @throws {ProductWithNoPriceFound} this error thrown when an item in the list has no price.
   */
  async recordSale(inputDto: RecordSaleInputDto) {
    const input = {
      cashierId: CashierId.create(inputDto.cashierId),
      items: inputDto.items.map((item) => ({
        productId: ProductId.create(item.productId),
        qty: Quantity.create(item.quantity),
        unit: item.unit,
      })),
    };
    // NOTE: Through this process the SALE RECORD would be made and at final would be registered.
    // Load prices [PricingService]

    const ids = input.items.map((item) => item.productId);

    // getting latest purchase prices of products for pricing for sale
    const purchasePrices =
      await this.purchaseDocumentsRepository.getLatestPurchasePricesOf(ids);

    // getting discounts of product those has
    const discounted = this.discountRepository.getProductsDiscounts(ids);

    const quantities = input.items.reduce<Record<string, Quantity>>(
      (prev, curr) => {
        prev[curr.productId.getValue()] = curr.qty;
        return prev;
      },
      {},
    );

    const units = input.items.reduce<Record<string, Packaging>>(
      (prev, curr) => {
        prev[curr.productId.getValue()] = curr.unit;
        return prev;
      },
      {},
    );

    // calculate invoice items
    const items = ids.map((id) =>
      Item.create({
        productId: id,
        quantity: quantities[id.getValue()],
        unit: units[id.getValue()],
      }),
    );

    const invoice = new SaleInvoice(input.cashierId);
    // Update inventory state

    // Adding items into invoice
    // See which has discount [DiscountService]
  }
}

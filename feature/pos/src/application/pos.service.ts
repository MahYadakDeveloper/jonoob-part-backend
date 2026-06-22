import { Quantity } from "@feature/shared";
import { Injectable } from "@nestjs/common";
import { SaleInvoice } from "domain/entities/sale-invoice";
import { type IDiscountRepository } from "domain/repositories/discount.repository";
import { type ISaleDocumentsRepository } from "domain/repositories/sale-documents.repository";
import { CashierId } from "domain/value-object/cashier-id";
import { Item } from "domain/value-object/item";
import { ProductId } from "../domain/value-object/product-id";
import { RecordSaleInputDto } from "./dto/record-sale.dto";
import { type ISynchronizer } from "./ports/synchronizer";
import { type IPurchaseDocumentRepository } from "domain/repositories/purchase-documents.repository";
import { type IMarkupPolicyProvider } from "./ports/markup-policy.provider";

@Injectable()
export class PosService {
  constructor(
    private readonly purchaseDocumentsRepository: IPurchaseDocumentRepository,
    private readonly saleDocumentsRepository: ISaleDocumentsRepository,
    private readonly discountRepository: IDiscountRepository,
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
      })),
    };
    // NOTE: Through this process the SALE RECORD would be made and at final would be registered.
    // Load prices [PricingService]

    const prices = await this.purchaseDocumentsRepository.getLatestPurchasePricesOf(
      input.items.map((item) => item.productId),
    );

    const invoice = SaleInvoice.create(input.cashierId);

    // Adding items into invoice
    input.items.map((item) => invoice.addItem(Item.create()));
    // See which has discount [DiscountService]
  }
}

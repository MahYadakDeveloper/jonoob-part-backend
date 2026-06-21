import { Quantity } from "@feature/shared";
import { Injectable } from "@nestjs/common";
import { type IProductsRepository } from "../domain/repositories/products.repository";
import { ProductId } from "../domain/value-object/product-id";
import { RecordSaleInputDto } from "./dto/record-sale.dto";
import { type IDiscountRepository } from "domain/repositories/discount.repository";

@Injectable()
export class PosService {
  constructor(
    private readonly productsRepository: IProductsRepository,
    private readonly discountRepository: IDiscountRepository,
  ) {}

  /**
   * NOTE: A SALE RECORD
   * {
   *    items: {
   *      productId, qty, baseUnit(count|pair|set), price(Money),discount(Money)
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
      items: inputDto.items.map((item) => ({
        productId: ProductId.create(item.productId),
        qty: Quantity.create(item.quantity),
      })),
    };
    // NOTE: Through this process the SALE RECORD would be made and at final would be registered.
    // Load prices [PricingService]
    const prices = await this.productsRepository.getProductsPrices(
      input.items.map((item) => item.productId),
    );

    // See which has discount [DiscountService]
  }
}

import { Test, TestingModule } from "@nestjs/testing";
import { PosService } from "./pos.service.ts";

describe("PosService", () => {
  let service: PosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({}).compile();

    service = module.get<PosService>(PosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("PosService.recordSale()", () => {
    it(`should roll back the inventory state and throw ProductNotFoundError when the transaction fails 
      in the middle of the sale for product not found`, async () => {
      const productsIds = ["x1", "x2", "x3", "x4"];
      const items = productsIds.map((productId) => ({
        productId,
        quantity: 2,
      }));
      const cashierId = "2";

      const productsDetailsSnapShotBeforeSaleRecord = await Promise.all(
        productsIds.map((productId) => service.getProductDetails(productId)),
      );

      await service.recordSale({
        cashierId,
        items,
      });

      const productsDetailsSnapShotAfterSaleRecord = await Promise.all(
        productsIds.map((productId) => service.getProductDetails(productId)),
      );

      expect(productsDetailsSnapShotAfterSaleRecord).toMatchObject(
        productsDetailsSnapShotAfterSaleRecord,
      );
    });

    it(
      "should warns about online ordered product amount is insufficient when cashier sells grater amount of product would be left for ordered to be processed",
    );

    it("should apply different prices for technician or merchant", () => {});

    it(`should roll back the inventory state and throw ProductHasNoPriceError when the transaction fails 
      in the middle of the sale for no price found`, async () => {
      const productsIds = ["x1", "x2", "x3", "x4"];
    });

    it(`should update the inventory state correctly after a successful sale transaction`, async () => {});

    it(`should account rewards for the customer after a successful sale when the customer is authorized and 
      the products have no discounts`, async () => {});

    it(`should apply the customer's account credit to the payment so that credit + due amount equals the total,
       and consume the credit after a successful transaction`, async () => {});
  });

  describe("PosService.getProductDetails(ProductId)", () => {});

  describe("PosService.getProductsDiscounts(ProductId[])", () => {});
});

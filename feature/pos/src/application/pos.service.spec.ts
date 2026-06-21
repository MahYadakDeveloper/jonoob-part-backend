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
    it(`should roll back the inventory state and throw ProductHasNoPrice when the transaction fails 
      in the middle of the sale`, async () => {});

    it(`should update the inventory state correctly after a successful sale transaction`, async () => {});

    it(`should account rewards for the customer after a successful sale when the customer is authorized and 
      the products have no discounts`, async () => {});

    it(`should apply the customer's account credit to the payment so that credit + due amount equals the total,
       and consume the credit after a successful transaction`, async () => {});
  });

  describe("PosService.getProductPrice()", () => {});

  describe("PosService.getProductsDiscounts()", () => {})

  
});

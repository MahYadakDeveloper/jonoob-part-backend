import { Test, TestingModule } from "@nestjs/testing";
import { Item } from "../domain/entities/item";
import { InvalidStockAdjustmentException } from "../domain/errors/invalid-stock-adjustment.error";
import {
  IWarehouseRepository,
  TOKEN_WAREHOUSE_REPO,
} from "../domain/repositories/warehouse.repository";
import { GoodId } from "../domain/value-object/good-id";
import { WarehouseService } from "./warehouse.service";

const GOOD_ID_SAMPLE1 = "1";

class MockedWarehouseRepository implements IWarehouseRepository {
  getStocksByGoodId(ids: GoodId[]): Promise<Item[]> {
    throw new Error("Method not implemented.");
  }
  receiptGoods(items: Item[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  issueGoodsAtomically(items: Item[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  adjustGoodsStock(item: Item): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

describe("WarehouseService", () => {
  let service: WarehouseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TOKEN_WAREHOUSE_REPO,
          useClass: MockedWarehouseRepository,
        },
        WarehouseService,
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("after stock adjustment should be same as adjustment value", async () => {
    // Assign
    await service.adjustWarehouseStock(GOOD_ID_SAMPLE1, 9);

    // Act
    const result = (
      await service.getAvailableStock(GOOD_ID_SAMPLE1)
    )?.getValue();

    // Assert
    expect(result).toBe(9);
  });

  it("adjusting stock to 0 and expecting to throw error", async () => {
    expect(
      async () => await service.adjustWarehouseStock(GOOD_ID_SAMPLE1, 0),
    ).rejects.toThrow(InvalidStockAdjustmentException);
  });

  it("expecting after issuing goods that reaching stock quantity to 0 be removed from warehouse", async () => {
    // Assign
    await service.adjustWarehouseStock(GOOD_ID_SAMPLE1, 3);
    // Act
    const result = await service.getAvailableStock(GOOD_ID_SAMPLE1);

    // Assert
    expect(result).toBe(undefined);
  });
});

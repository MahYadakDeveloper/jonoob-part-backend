import { Test, TestingModule } from "@nestjs/testing";
import { WarehouseStockRecordNotFoundError } from "../domain/errors/WarehouseStockRecordNotFound";
import { WarehouseService } from "./warehouse.service";
import { DatabaseModule } from "@infra/database";
import { PrismaWarehouseRepository } from "@infra/warehouse-repo";
import { WAREHOUSE_REPOSITORY } from "../domain/repositories/warehouse.repository";
import { ConfigModule } from "@nestjs/config";

describe("WarehouseService", () => {
  let service: WarehouseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ".env.test",
        }),
        DatabaseModule,
      ],
      providers: [
        {
          provide: WAREHOUSE_REPOSITORY,
          useClass: PrismaWarehouseRepository,
        },
        WarehouseService,
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("expecting the good to be not found after issuing all stock", async () => {
    // Assign
    const goodId = "3";
    // await service.recordGoodsReceipt({ items: [{ goodId }] });

    // Act
    await service.recordGoodsIssue({ items: [{ goodId, qty: 2 }] });

    // Assert
    await expect(service.getGoodStock({ goodId })).rejects.toThrow(
      WarehouseStockRecordNotFoundError,
    );
  });

  // it("after stock adjustment should be same as adjustment value", async () => {
  //   // Assign
  //   await service.adjustWarehouseStock(GOOD_ID_SAMPLE1, 9);

  //   // Act
  //   const result = (
  //     await service.getAvailableStock(GOOD_ID_SAMPLE1)
  //   )?.getValue();

  //   // Assert
  //   expect(result).toBe(9);
  // });

  // it("adjusting stock to 0 and expecting to throw error", async () => {
  //   expect(
  //     async () => await service.adjustWarehouseStock(GOOD_ID_SAMPLE1, 0),
  //   ).rejects.toThrow(InvalidStockAdjustmentException);
  // });

  // it("expecting after issuing goods that reaching stock quantity to 0 be removed from warehouse", async () => {
  //   // Assign
  //   await service.adjustWarehouseStock(GOOD_ID_SAMPLE1, 3);
  //   // Act
  //   const result = await service.getAvailableStock(GOOD_ID_SAMPLE1);

  //   // Assert
  //   expect(result).toBe(undefined);
  // });
});

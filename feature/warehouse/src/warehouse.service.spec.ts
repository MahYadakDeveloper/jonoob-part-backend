import { Test, TestingModule } from "@nestjs/testing";
import { WarehouseStockRecordNotFoundError } from "../domain/errors/WarehouseStockRecordNotFound";
import { WarehouseService } from "./warehouse.service";
import { DatabaseModule } from "@infra/database";
import { PrismaWarehouseRepository } from "@infra/warehouse-repo";
import { WAREHOUSE_REPOSITORY } from "../domain/repositories/warehouse.repository";
import { ConfigModule } from "@nestjs/config";
import { GetStockAvailabilityOutputDto } from "./dto/get-stock-availability.dto";
import { InvalidStockAdjustmentException } from "./../domain/errors/invalid-stock-adjustment.error";

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
    let goodId = "x99";

    await service.recordGoodsReceipt({ items: [{ goodId }] });

    // Assert_2
    // await expect(service.getGoodStock({ goodId })).resolves.toMatchObject({
    //   quantity: 1,
    // } satisfies GetStockAvailabilityOutputDto);
    const { stock } = await service.getGoodStock({ goodId });

    // Act
    await service.recordGoodsIssue({ items: [{ goodId, qty: stock }] });

    // Assert_3
    await expect(service.getGoodStock({ goodId })).rejects.toThrow(
      WarehouseStockRecordNotFoundError,
    );
  });

  it("after stock adjustment should be same as adjustment value", async () => {
    const goodId = "x88";
    const stock = 6;
    // Assign
    try {
      await service.getGoodStock({ goodId });
    } catch {
      await service.recordGoodsReceipt({ items: [{ goodId }] });
    }

    await service.adjustWarehouseStock({ goodId, stock: stock });

    // Act
    const result = await service.getGoodStock({ goodId });

    // Assert
    expect(result).toBe(6);
  });

  it("adjusting stock to 0 and expecting to throw error", async () => {
    const goodId = "x88";
    const stock = 0;
    // Assign
    try {
      await service.getGoodStock({ goodId });
    } catch {
      await service.recordGoodsReceipt({ items: [{ goodId }] });
    }
    expect(
      async () => await service.adjustWarehouseStock({ goodId, stock }),
    ).rejects.toThrow(InvalidStockAdjustmentException);
  });
});

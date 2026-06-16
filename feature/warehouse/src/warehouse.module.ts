import { DynamicModule, Module, Provider } from "@nestjs/common";
import { WarehouseController } from "./presentation/warehouse.controller";
import { WarehouseService } from "./application/warehouse.service";

@Module({})
export class WarehouseModule {
  static register(providers: Provider[]): DynamicModule {
    return {
      module: WarehouseModule,
      providers: [...providers, WarehouseService],
      controllers: [WarehouseController],
      exports: [],
    };
  }
}

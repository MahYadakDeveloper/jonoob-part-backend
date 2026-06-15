import { Controller } from "@nestjs/common";
import { WarehouseService } from "../application/warehouse.service";

@Controller()
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}
}

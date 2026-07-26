import { Fitment } from "@feature/fitment-api";
import {Fitment as FitmentDto} from "@feature/fitment-api"
import { FitmentHierarchy, FitmentNode } from "../model/fitment";
import { ancestors } from "../utils";

export class FitmentMapper {
  toDto(
    fitment: Fitment,
    hierarchy: FitmentHierarchy,
  ): FitmentDto {
    const result: Partial<FitmentDto> = {
      modelYearRange: fitment.modelYearRange,
    };

    for (const node of ancestors(hierarchy)) {
      this.mapNode(result, node);
    }

    return result as FitmentDto;
  }

  private mapNode(
    result: Partial<FitmentDto>,
    node: FitmentHierarchy,
  ) {
    switch (node.type) {
      case "":
        result.make = {
          name: node.name,
          logo: node.logo,
        };
        return;

      default:
        result[node.type] = node.name;
    }
  }
}
import { FitmentApi, FitmentDto, FitmentRequest, FitmentResponse } from '@feature/fitment-api';
import { FitmentRepository } from './fitment.repository';
import { Fitment, FitmentHierarchyNode } from './model/fitment';
import { ancestors } from './utils';

export class FitmentService implements FitmentApi {
  constructor(private readonly repository: FitmentRepository) {}

  async findById({ id }: FitmentRequest): Promise<FitmentResponse> {
    const fitment = await this.repository.find(id);

    const hierarchy = await this.repository.findNodeHierarchy(fitment.nodeReference);

    return {
      fitment: this.toDto(fitment, hierarchy),
    };
  }

  // TODO Complete this CURD
  async create() {}
  async update() {}
  async delete() {}

  /**
   * Mapper
   */
  private toDto(fitment: Fitment, node: FitmentHierarchyNode): FitmentDto {
    const result: Partial<FitmentDto> = {
      modelYearRange: fitment.modelYearRange,
    };

    for (const current of ancestors(node)) {
      if (current.type === 'make') {
        result.make = {
          name: current.name,
          logo: current.logo,
        };

        continue;
      }

      result[current.type] = current.name;
    }

    return result as FitmentDto;
  }
}

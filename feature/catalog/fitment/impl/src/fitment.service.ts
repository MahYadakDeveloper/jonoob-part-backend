import {
  FitmentApi,
  Fitment as FitmentDto,
  FitmentRequest,
  FitmentResponse,
} from '@feature/fitment-api';
import { FitmentRepository } from './fitment.repository';
import { ancestors } from './utils';

export class FitmentService implements FitmentApi {
  constructor(private readonly repository: FitmentRepository) {}

  async findById({ id }: FitmentRequest): Promise<FitmentResponse> {
    const fitment = await this.repository.find(id);

    const fitmentNode = await this.repository.findNodeHierarchy(fitment.nodeReference);

    // Mapper
    const result: Partial<FitmentDto> = {
      modelYearRange: fitment.modelYearRange,
    };

    for (const node of ancestors(fitmentNode)) {
      switch (node.type) {
        case 'make':
          result.make = {
            name: node.name,
            logo: node.logo,
          };
          break;

        default:
          result[node.type] = node.name;
      }
    }

    return {
      fitment: result as FitmentDto,
    };
  }

  async create() {}
  async update() {}

  async delete() {}


}

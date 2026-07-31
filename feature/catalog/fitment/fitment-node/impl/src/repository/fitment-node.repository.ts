import { LineItems } from '@feature/common';
import { BaseFitmentNode, CreateNode, UpdateNode } from '../model/fitment-node';

export interface FitmentNodeRepository {
  find(filter: {
    where: { name: string; type: string; parentId?: string };
  }): Promise<BaseFitmentNode>;
  findById(id: string): Promise<BaseFitmentNode>;
  findHierarchyNodeById(id: string): Promise<BaseFitmentNode | null>;
  findManyHierarchyNodesByIds(ids: string[]): Promise<LineItems<BaseFitmentNode>>;

  findDescendants(id: string): Promise<string[]>;

  create(data: CreateNode): Promise<string>;

  update(id: string, data: UpdateNode): Promise<void>;

  deleteMany(ids: string[]): Promise<void>;
}

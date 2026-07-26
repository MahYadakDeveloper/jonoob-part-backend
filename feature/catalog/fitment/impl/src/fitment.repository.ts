import { Fitment, FitmentHierarchyNode } from './model/fitment';

export interface FitmentRepository {
  find(id: string): Promise<Fitment>;
  findNodeHierarchy(referenceId: string): Promise<FitmentHierarchyNode>;
}

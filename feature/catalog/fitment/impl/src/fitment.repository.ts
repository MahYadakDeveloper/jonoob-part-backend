import { Fitment, FitmentNodeDeep } from './model/fitment';

export interface FitmentRepository {
  find(id: string): Promise<Fitment>;
  findNodeHierarchy(referenceId: string): Promise<FitmentNodeDeep>;
}

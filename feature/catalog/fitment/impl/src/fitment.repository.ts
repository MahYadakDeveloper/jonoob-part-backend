import { FitmentNodeDeep, FitmentReference } from "./model/fitment";

export interface FitmentRepository {
  findReference(id: string): Promise<FitmentReference>
  findNodeDeep(referenceId: string): Promise<FitmentNodeDeep>
}
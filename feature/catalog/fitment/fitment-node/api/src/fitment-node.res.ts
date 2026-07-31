import { LineItems } from '@feature/common';
import { FitmentNode } from './fitment-node.types';

export interface FindFitmentNodeResponse {
  node: FitmentNode;
}

export interface FindManyFitmentNodeResponse {
  nodes: LineItems<FitmentNode>;
}

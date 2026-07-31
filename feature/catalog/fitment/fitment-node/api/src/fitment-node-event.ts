import { LineItems } from '@feature/common';
import { FitmentNode } from './fitment-node.types';

export const FitmentNodeDeletedEvent = 'catalog.fitment-node-deleted';
export type FitmentNodeDeletedPayload = {
  fitmentNodes: LineItems<FitmentNode>;
};

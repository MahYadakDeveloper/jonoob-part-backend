import { LineItems } from '@feature/common';
import { FitmentNode } from './fitment-node.types';

export const FitmentNodeDeletedEventType = 'catalog.fitment-node-deleted';
export type FitmentNodeDeletedPayload = {
  fitmentNodes: LineItems<FitmentNode>;
};

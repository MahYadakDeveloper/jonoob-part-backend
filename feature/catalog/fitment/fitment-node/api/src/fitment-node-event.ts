import { LineItems } from '@feature/common';
import { FitmentNode } from './fitment-node.types';

export const FitmentNodeDeletedEventType = 'catalog.fitment-node-deleted';
export const FitmentNodeUpdatedEventType = 'catalog.fitment-node-updated';
export type FitmentNodeDeletedEventPayload = {
  fitmentNodes: LineItems<FitmentNode>;
};

export type FitmentNodeUpdatedEventPayload = {
  fitmentNodeId: string;
};

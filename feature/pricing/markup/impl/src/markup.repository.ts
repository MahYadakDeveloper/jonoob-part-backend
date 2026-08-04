import { LineItems } from '@feature/common';
import { GlobalMarkupPolicy, MarkupPolicy, MarkupScope } from './model/markup-policy';

export type MarkupReference = {
  scope: MarkupScope;
  referenceId: string;
};

export interface MarkupPolicyRepository {
  // [TODO] select key by its id not references
  findManyByReference(references: MarkupReference[]): Promise<LineItems<MarkupPolicy>>;
  globalMarkup(pricingPolicy: 'wholesale' | 'retail'): Promise<GlobalMarkupPolicy>;
}

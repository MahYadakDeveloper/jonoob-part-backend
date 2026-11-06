// ALLOWED for impl (modulePath: lint-sample-b/pricing)
import { SAMPLE_B_CATALOG_API } from '@feature.api/lint-sample-b-catalog';
import { SAMPLE_B_PRICING_API } from '@feature.api/lint-sample-b-pricing';

export const ALLOWED = [
  SAMPLE_B_PRICING_API, // own api
  SAMPLE_B_CATALOG_API, // sibling api (same parent)
];

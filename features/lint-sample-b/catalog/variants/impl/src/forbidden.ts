// FORBIDDEN for a depth-3 impl (modulePath: lint-sample-b/catalog/variants)
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { SAMPLE_B_CATALOG_API } from '@feature.api/lint-sample-b-catalog';
import { SAMPLE_B_PRICING_API } from '@feature.api/lint-sample-b-pricing';

export const FORBIDDEN = [
  SAMPLE_B_CATALOG_API, // parent api (never anything above)
  SAMPLE_B_API, // grandparent api
  SAMPLE_B_PRICING_API, // sibling of the parent, not of this module
];

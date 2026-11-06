// ALLOWED for a depth-3 impl (modulePath: lint-sample-b/catalog/variants)
import { SAMPLE_A_API } from '@feature.api/lint-sample-a';
import { SAMPLE_B_CATALOG_VARIANTS_API } from '@feature.api/lint-sample-b-catalog-variants';

export const ALLOWED = [
  SAMPLE_B_CATALOG_VARIANTS_API, // own api
  SAMPLE_A_API, // root api of another feature
];

// ALLOWED for impl (modulePath: lint-sample-b/catalog)
import { SAMPLE_A_API } from '@feature.api/lint-sample-a';
import { SAMPLE_B_CATALOG_API } from '@feature.api/lint-sample-b-catalog';
import { SAMPLE_B_CATALOG_VARIANTS_API } from '@feature.api/lint-sample-b-catalog-variants';
import { SAMPLE_B_PRICING_API } from '@feature.api/lint-sample-b-pricing';

export const ALLOWED = [
  SAMPLE_B_CATALOG_API, // own api
  SAMPLE_B_CATALOG_VARIANTS_API, // child api (one level lower)
  SAMPLE_B_PRICING_API, // sibling api (same parent)
  SAMPLE_A_API, // root api of another feature
];

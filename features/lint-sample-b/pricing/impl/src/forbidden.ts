// FORBIDDEN for impl (modulePath: lint-sample-b/pricing)
import { SAMPLE_B_CATALOG_VARIANTS_API } from '@feature.api/lint-sample-b-catalog-variants';
import { SAMPLE_B_CATALOG_IMPL } from '@feature.impl/lint-sample-b-catalog';

export const FORBIDDEN = [
  SAMPLE_B_CATALOG_VARIANTS_API, // child of a sibling (depth 3)
  SAMPLE_B_CATALOG_IMPL, // sibling impl (api only)
];

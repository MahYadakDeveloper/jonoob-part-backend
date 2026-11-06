// FORBIDDEN for impl (modulePath: lint-sample-b/catalog)
import { SAMPLE_A_ORDERS_ITEMS_API } from '@feature.api/lint-sample-a-orders-items';
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { SAMPLE_B_CATALOG_HTTP } from '@feature.http/lint-sample-b-catalog';
import { SAMPLE_B_CATALOG_VARIANTS_IMPL } from '@feature.impl/lint-sample-b-catalog-variants';

export const FORBIDDEN = [
  SAMPLE_B_API, // parent api (never anything above)
  SAMPLE_B_CATALOG_HTTP, // another layer (http)
  SAMPLE_B_CATALOG_VARIANTS_IMPL, // child impl (api only)
  SAMPLE_A_ORDERS_ITEMS_API, // depth-3 api of another feature
];

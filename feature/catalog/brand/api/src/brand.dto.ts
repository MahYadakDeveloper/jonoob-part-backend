import { MediaRef } from '@feature/common';

/**
 * Brand / Manufacturer information used by the catalog.
 *
 * Examples:
 * - Bosch
 * - Valeo
 * - NGK
 */
export type BrandDto = {
  /**
   * Display name shown to users.
   */
  name: string;

  /**
   * SEO-friendly unique slug used in URLs.
   * Example: "bosch"
   */
  slug: string;

  /**
   * Brand logo stored in Media module.
   * Only a file reference is stored here.
   */
  logo?: MediaRef;

  /**
   * Short description shown on the brand page.
   */
  description?: string;
};

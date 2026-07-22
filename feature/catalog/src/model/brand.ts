import { MediaRef } from "@feature/media-api";

/**
 * Brand / Manufacturer information used by the catalog.
 *
 * Examples:
 * - Bosch
 * - Valeo
 * - NGK
 * - ایساکو
 */
export type Brand = {
  /**
   * Stable unique identifier.
   * Prefer UUID/ULID.
   */
  id: string;

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

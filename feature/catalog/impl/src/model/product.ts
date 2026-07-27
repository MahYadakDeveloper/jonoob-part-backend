import { MediaRef, RawProduct } from '@feature/common';

// export type EnrichedData = {
//   price: Money;
//   stock: number;
//   unitOfMeasure?: UnitOfMeasure;
//   storageLocation?: string;
// };

/**
 * TODO: Use this for improving searching results.
 * Generated search projection for Elasticsearch indexing.
 */
type SearchText = string[];

export type SpecificationReferences = {
  brandId?: string;
  categoryIds: string[]; // (taxonomy) `CategoryNode` referenced
  fitmentIds: string[];
};

export type ProductQuality = 'oe' | 'oem' | 'aftermarket';

export type Product = RawProduct & {
  id: string;
  displayName: string; // this is generated base on technical
  canonicalName: string; // model-[...variants], we do not doing search base on this

  // TODO: Add constraint to ensure product images only accept valid image MIME types.
  // Allowed MIME types should be restricted to image formats (e.g. image/jpeg, image/png, image/webp).
  images: MediaRef[];

  /**
   * Human-defined alternative names.
   * Used as semantic synonyms.
   */
  aliases: string[];

  emplacement?: string;
  quality?: ProductQuality;

  description?: {
    format: 'mdx';
    content: string;
  };

  // enriched?: EnrichedData;
  references: SpecificationReferences;
};

// export type SelectKeys<T, S extends Partial<Record<keyof T, boolean>>> = {
//   [K in keyof S]: S[K] extends true ? K : never;
// }[keyof S] &
//   keyof T;

// export type Selected<T, S extends Partial<Record<keyof T, boolean>>> = Pick<
//   T,
//   SelectKeys<T, S>
// >;

// export type PopulatedProduct<
//   S extends Partial<Record<keyof , boolean>>,
// > = RawProduct & {
//   populated: Selected<Specifications, S>;
//   references: SpecificationReferences;
// };

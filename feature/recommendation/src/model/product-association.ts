/**
 * Defines why two products are considered related.
 *
 * manual:
 *   Relation explicitly created by admin/business user.
 *   Example:
 *     Brake pad -> Brake cleaner
 *
 * category:
 *   Automatically generated based on category taxonomy.
 *   Example:
 *     Products under the same parent category.
 *
 * fitment:
 *   Products related because they fit the same vehicle/model.
 *   Example:
 *     Peugeot 405 air filter -> Peugeot 405 oil filter
 *
 * alternative:
 *   Products that can replace each other.
 *   Example:
 *     Brand A sensor -> Brand B equivalent sensor
 *
 * bundle:
 *   Products usually purchased together.
 *   Example:
 *     Clutch kit -> Clutch alignment tool
 */
export type ProductRelationType =
  | "manual"
  | "category"
  | "fitment"
  | "alternative"
  | "bundle";

/**
 * Explicit relation between two products.
 *
 * This is stored independently from Product because:
 * - Product aggregate should not grow with recommendation logic.
 * - Relations may change frequently.
 * - Multiple relation sources can exist.
 */
export type ProductAssociation = {
  /**
   * The product from which we start the relation.
   *
   * Example:
   * Product page:
   *   Peugeot 405 Fuel Pump
   *
   * sourceProductId: (productId)
   */
  sourceProductId: string;

  /**
   * The recommended/related product.
   */
  targetProductId: string;

  /**
   * The reason this relation exists.
   */
  type: ProductRelationType;

  /**
   * Business priority.
   *
   * Higher priority products appear first.
   *
   * Mostly useful for manual relations.
   */
  priority?: number;

  /**
   * Optional metadata.
   *
   * Example:
   * {
   *   createdBy: "admin",
   *   note: "Frequently sold together"
   * }
   */
  metadata?: Record<string, unknown>;
};

/**
 * Strategy for automatically finding related products.
 *
 * These rules are not stored on Product.
 * They belong to Catalog recommendation logic.
 */
export type RelatedProductRule =
  | ParentCategoryRelatedRule
  | SameCategoryRelatedRule
  | FitmentRelatedRule;


/**
 * Finds products from the parent category.
 *
 * Example:
 *
 * Category:
 *   Electrical System
 *       |
 *       +-- Relay
 *
 * Product:
 *   Fan Relay
 *
 * Search products from:
 *   Electrical System
 */
export type ParentCategoryRelatedRule = {
  strategy: "parent_category";


  /**
   * How many levels should move upward.
   *
   * 1:
   *   direct parent
   *
   * 2:
   *   grand parent
   */
  depth: number;


  /**
   * Maximum returned products.
   */
  limit: number;
};



/**
 * Finds products from the same category.
 *
 * Example:
 *
 * Relay category:
 *   Relay A
 *   Relay B
 *   Relay C
 */
export type SameCategoryRelatedRule = {
  strategy: "same_category";


  /**
   * Exclude current product.
   */
  excludeCurrentProduct: boolean;


  limit: number;
};



/**
 * Finds products with the same vehicle compatibility.
 *
 * Example:
 *
 * Peugeot 405:
 *   Air filter
 *   Oil filter
 *   Fuel filter
 */
export type FitmentRelatedRule = {
  strategy: "same_fitment";


  limit: number;
};

/**
 * Defines how related products are generated for a product page.
 */
export type RelatedProductsConfiguration = {
  /**
   * Explicitly selected products by admin.
   */
  manualProductIds: string[];


  /**
   * Automatic generation rules.
   */
  rules: RelatedProductRule[];


  /**
   * Final maximum items shown to customer.
   */
  limit: number;
};

export type RelatedProductResult = {
  productId: string;


  /**
   * Why this product was recommended.
   *
   * Useful for debugging and analytics.
   */
  source:
    | "manual"
    | "category"
    | "fitment"
    | "alternative"
    | "bundle";


  priority: number;
};
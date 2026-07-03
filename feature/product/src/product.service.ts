export class ProductService {
  /**
   * This method is responsible for enriching information such as price, stock, discounts, and more.
   */
  private enrich(product): Promise<Product> {}

  /**
   * This method is responsible for populating information such as display name, description, images, and more.
   */
  private populate(product): Promise<Product> {}

  /**
   * Retrieves a product by its ID.
   *
   * Workflow:
   * 1. Retrieve the product stock (defaults to zero if not found).
   * 2. Enrich the product with dynamic information when it is in stock.
   * 3. Populate descriptive information.
   * 4. Return the assembled product.
   *
   * Throws if the product cannot be populated.
   * 
   * req: {
   *  ...
   *  view: "enriched" | "populated" | "full"
   *  ...
   * }
   */
  findById(): Promise<Product> {}
  findManyById(): Promise<Product[]> {}

  /**
   *
   * @param input : {
   *    query?: string;
   *    page: number;
   *    pageSize: number;
   *    sort?: ProductSort;
   *    filter?: Filter;
   *    view: "enriched" | "populated" | "full"
   *    ...
   *  }
   */
  search(input) {}

  /**
   * Defines the product metadata that is later loaded by `populate()`
   * to build a complete product representation.
   */
  define(input) {}
}

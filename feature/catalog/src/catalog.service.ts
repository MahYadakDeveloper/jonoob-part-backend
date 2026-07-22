
export class CatalogService {
  /**
   * Infra Note For future: use redis for this.
   * This method is responsible for enriching information such as price, stock, discounts, and more.
   */
  private enrich(product): Promise<Extract<Product, { kind: "product" }>> {
    throw new Error("Method not implemented yet!");
  }

  /**
   * Infra Note For future: use redis for this.
   * This method is responsible for populating information such as display name, description, images, and more.
   */
  private populate(product): Promise<Extract<Product, { kind: "product" }>> {
    throw new Error("Method not implemented yet!");
  }

  /**
   * Note: Redis would be used as cache aside for the product too
   *  only product only retrieved by redis if products id is given.
   *
   * Note: For meaningful or anything else for product searching
   *  we use elastic
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
  findById(): Promise<> {
    throw new Error("Method not implemented yet!");
  }
  findManyById(): Promise<> {
    throw new Error("Method not implemented yet!");
  }

  /**
   * Note: Redis would be used as cache aside for the product too
   *  only product only retrieved by redis if products id is given.
   *
   * Note: For meaningful or anything else for product searching
   *  we use elastic
   * @param input : {
   *    query?: string;
   *    page: number;
   *    pageSize: number;
   *    sort?: ProductSort;
   *    filter?: Filter;
   *    view: "enriched" | "populated" | "full"
   *    ...
   *  }
   * @param output : {
   *    page: number;
   *    items: Product[]
   *    ...
   * }
   * NOTE: Return type include product list witch their kind may "product" | "bundle"
   */
  search(input) {}

  /**
   * Defines the product metadata that is later loaded by `populate()`
   * to build a complete product representation.
   *
   * Note: Product could be a bundle of product or product
   *  in notes we have we did the struct of document.
   */
  define(input) {}
}

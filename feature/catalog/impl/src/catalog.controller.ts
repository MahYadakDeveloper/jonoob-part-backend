import { type MediaApi } from '@feature/media-api';
import { Controller, Delete, Get, Post, Put, Query, Req } from '@nestjs/common';
import { CatalogService } from 'catalog.service';
import { type CatalogContext, type CatalogContextProvider } from 'context/catalog.context';
import { CatalogContextParam } from 'decorator/catalog-context.decorator';
import { SearchProductParamsDto } from 'dto/search-params.dto';

/**
 * Exposes endpoints for managing catalog products.
 *
 * This controller is responsible only for product-related operations under
 * the `/catalog` route. Other catalog resources (e.g. brands, categories,
 * fitments) are implemented in their own dedicated controllers under their
 * respective routes, such as `/catalog/brands` and `/catalog/fitments`.
 */
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly media: MediaApi,
    private readonly contextProvider: CatalogContextProvider,
  ) {}
  @Get(':id')
  product() {}

  @Get()
  async search(
    @Query() params: SearchProductParamsDto,
    @CatalogContextParam() ctx: CatalogContext,
  ) {
    return this.contextProvider.run(ctx, () => {
      return this.catalog.search(params);
    });
  }

  /**
   * Handles a multipart/form-data request.
   *
   * This endpoint expects uploaded files and will consume them using
   * Fastify's multipart API (e.g. `await req.file()` or `req.parts()`).
   *
   * Prerequisite:
   * The `@fastify/multipart` plugin must be registered during application
   * bootstrap. Otherwise, multipart APIs will not be available on the request
   * object and this endpoint will fail at runtime.
   *
   * Note:
   * `req` is intentionally typed as `any` because Fastify augments the request
   * object with multipart methods via plugin registration rather than static
   * typings. Refer to the Fastify Request documentation for the available APIs.
   */
  @Post()
  createOne(@Req() req: any) {
    /**
     * TODO(media):
     *
     * Create product with media transaction-like flow.
     *
     * Flow:
     * 1. Upload incoming media files to the Media module.
     * 2. Resolve uploaded media references (mediaRefs).
     * 3. Create the product using the resolved media references.
     *
     * Rollback:
     * - If product creation fails, delete all uploaded media to avoid
     *   leaving orphaned files in the Media module.
     *
     * NOTE:
     * Media is created before the product, so manual cleanup is required
     * if the product cannot be persisted.
     */

    try {
      // Create product
    } catch (err) {
      // Delete uploaded media (rollback)
    }
  }

  @Put()
  updateOne() {
    /**
     * [TODO] (media):
     *
     * Update product media atomically.
     *
     * Flow:
     * 1. Compare incoming media references with Media module.
     *    - Upload only files that do not already exist.
     *    - Collect the uploaded media references (newMediaRefs).
     *
     * 2. Load the product's current media references (oldMediaRefs).
     *
     * 3. Update the product with the final media references.
     *
     * 4. After a successful update, remove media files that existed on the
     *    product previously but are no longer referenced.
     *
     * 5. If the product update fails, rollback by deleting every uploaded
     *    media in newMediaRefs to avoid orphaned files.
     *
     * NOTE:
     * A file is considered existing if the Media module already has a media
     * record with the same identifier/metadata, so it should not be uploaded
     * again.
     */
  }

  @Delete()
  deleteOne() {
    /**
     * [TODO] (media):
     *
     * Delete product and its associated media.
     *
     * Flow:
     * 1. Load the product and collect its current media references (mediaRefs).
     * 2. Delete the product.
     * 3. After a successful deletion, remove the associated media from the
     *    Media module using the previously collected mediaRefs.
     *
     * NOTE:
     * Media references must be resolved before deleting the product, since
     * they are no longer accessible afterwards.
     *
     * TODO:
     * Consider whether media should be deleted only when it is no longer
     * referenced by any other resource.
     */
  }
}

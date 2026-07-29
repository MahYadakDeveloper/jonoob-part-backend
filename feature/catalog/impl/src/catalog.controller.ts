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
    // ...
  }

  @Delete()
  deleteOne() {}

  @Put()
  updateOne() {}
}

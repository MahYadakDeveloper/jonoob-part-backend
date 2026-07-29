import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CatalogContext, CatalogVisibility } from '../context/catalog.context';

export const CatalogContextParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CatalogContext => {
    const request = ctx.switchToHttp().getRequest();
    return {
      visibility:
        request.user.role === 'customer'
          ? CatalogVisibility.Storefront
          : CatalogVisibility.Internal,
    };
  },
);

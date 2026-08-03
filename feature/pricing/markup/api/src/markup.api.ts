import { ResolveManyMarkupRequest, ResolveMarkupRequest } from './markup.req';
import { ResolveManyMarkupResponse, ResolveMarkupResponse } from './markup.res';

export interface MarkupApi {
  resolve(req: ResolveMarkupRequest): Promise<ResolveMarkupResponse>;
  resolveMany(req: ResolveManyMarkupRequest): Promise<ResolveManyMarkupResponse>;
}

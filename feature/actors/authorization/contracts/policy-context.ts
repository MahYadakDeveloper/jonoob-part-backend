export interface PolicyContext {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
}

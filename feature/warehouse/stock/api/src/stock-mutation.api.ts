export const STOCK_MUTATION_API = Symbol('STOCK_MUTATION_API');
export interface StockMutationApi {
  increase(stocks: { id: string; quantity: number }[]): Promise<void>;
  decrease(stocks: { id: string; quantity: number }[]): Promise<void>;
}

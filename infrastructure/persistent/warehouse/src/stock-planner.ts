import { InsufficientStockError, StockNotFoundError } from "@feature/warehouse";

export type StockChangePlan = {
  updates: Map<string, number>;
  deletions: string[];
};

export function planStockChanges(
  stocks: Map<string, number>,
  requested: Map<string, number>,
): StockChangePlan {
  const updates: Map<string, number> = new Map();
  const deletions: string[] = [];

  for (const [id, quantity] of requested) {
    const stock = stocks.get(id);

    if (stock === undefined) throw new StockNotFoundError(id);

    checkSufficientStock(stock, quantity);

    if (stock === quantity) {
      deletions.push(id);
    } else {
      updates.set(id, stock - quantity);
    }
  }

  return { updates, deletions };
}

export function checkSufficientStocks(
  stocks: Map<string, number>,
  requested: Map<string, number>,
) {
  for (const [id, quantity] of requested) {
    const stock = stocks.get(id);

    if (!stock) throw new StockNotFoundError(id);

    checkSufficientStock(quantity, stock);
  }
}

function checkSufficientStock(stock: number, requested: number) {}

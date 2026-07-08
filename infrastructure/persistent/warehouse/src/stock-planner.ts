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

    if (!stock) throw new StockNotFoundError(id);

    checkSufficientStock(stock, quantity);

    if (stock === quantity) {
      deletions.push(id);
    } else {
      const remaining = stock - quantity;

      updates.set(id, remaining);
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

function checkSufficientStock(stock: number, requested: number) {
  if (stock < requested)
    throw new InsufficientStockError("Insufficient stock.");
}

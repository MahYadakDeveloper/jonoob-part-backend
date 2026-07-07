import { InsufficientStockError } from "@feature/warehouse";

type StockChangePlan = {
  updates: Map<string, number>;
  deletions: string[];
};

export function planStockChanges(
  stocks: Map<string, number>,
  issueItems: Map<string, number>,
): StockChangePlan {
  const updates: Map<string, number> = new Map();
  const deletions: string[] = [];

  for (const [id, quantity] of issueItems) {
    const stock = stocks[id];

    if (stock === undefined || stock < quantity)
      throw new InsufficientStockError("Insufficient stock.");

    if (stock === quantity) {
      deletions.push(id);
    } else {
      const remaining = stock - quantity;

      updates.set(id, remaining);
    }
  }

  return { updates, deletions };
}

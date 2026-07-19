import { Injectable } from "@nestjs/common";
import { StockDatasource } from "../stock.datasource";

@Injectable()
export class PrismaStockDatasource implements StockDatasource{
  constructor(private readonly prisma: PrismaClient){}
    find(id: string): Promise<{ goodId: string; quantity: number; } | undefined> {
        throw new Error("Method not implemented.");
    }
    findMany(ids: readonly string[]): Promise<{ goodId: string; quantity: number; }[]> {
        throw new Error("Method not implemented.");
    }
    findManyForUpdate(ids: readonly string[]): Promise<{ goodId: string; quantity: number; }[]> {
        throw new Error("Method not implemented.");
    }
    create(entity: { goodId: string; quantity: number; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    update(entity: { goodId: string; quantity: number; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    updateMany(entities: readonly { goodId: string; quantity: number; }[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteMany(ids: string[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    transaction<TResult>(callback: (datasource: this) => Promise<TResult>): Promise<TResult> {
        throw new Error("Method not implemented.");
    }

}
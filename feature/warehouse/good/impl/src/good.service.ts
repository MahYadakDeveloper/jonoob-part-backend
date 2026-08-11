import {
  FindGoodByBarcodeRequest,
  FindGoodByBarcodeResponse,
  FindGoodRequest,
  FindGoodResponse,
  FindManyGoodRequest,
  FindManyGoodResponse,
  GoodCreationRequest,
  GoodCreationResponse,
  GoodDeletionRequest,
  GoodUpdatingRequest,
  WarehouseGoodApi,
} from '@feature/warehouse-good-api';
import { Injectable } from '@nestjs/common';
import { type WarehouseGoodRepository } from './good.repository';

@Injectable()
export class WarehouseGoodService implements WarehouseGoodApi {
  constructor(private readonly repository: WarehouseGoodRepository) {}

  async find({ goodId }: FindGoodRequest): Promise<FindGoodResponse> {
    const good = await this.repository.find(goodId);
    return { good };
  }

  async findMany({ goodIds }: FindManyGoodRequest): Promise<FindManyGoodResponse> {
    const goods = await this.repository.findMany(goodIds);
    return { goods };
  }

  async findByBarcode({ barcode }: FindGoodByBarcodeRequest): Promise<FindGoodByBarcodeResponse> {
    const good = await this.repository.findByBarcode(barcode);
    return { good };
  }

  async create({ good }: GoodCreationRequest): Promise<GoodCreationResponse> {
    const goodId = await this.repository.create(good);
    return {
      goodId,
    };
  }

  async update({ good }: GoodUpdatingRequest): Promise<void> {
    await this.repository.update(good);
  }

  async delete({ goodId }: GoodDeletionRequest): Promise<void> {
    await this.repository.delete(goodId);
  }
}

import { LineItems } from '@feature/common';
import { Replenishment } from './replenishment.type';

export interface FindByGoodIdRequest {
  goodId: string;
}

export interface FindAllRequest {
  skip?: number;
  take?: number;
}

export interface FindAllResponse {
  replenishment: LineItems<Replenishment>;
}

export interface ReplenishmentRequest {
  replenishment: Replenishment;
}

export interface ManyReplenishmentRequest {
  replenishment: LineItems<Replenishment>;
}

export interface RemoveReplenishmentRequest {
  goodIds: string[];
}

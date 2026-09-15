import { MongoAbility } from '@casl/ability';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { OrderService } from './order.service';

export type User =
  | {
      role: 'admin';
    }
  | {
      role: 'manager';
      id: string;
    }
  | {
      role: 'courier';
      id: string;
    }
  | {
      role: 'customer';
      id: string;
    };

export interface AbilityFactory {
  createFor(): MongoAbility;
}

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private readonly order: OrderService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<Request>();
    request.this.order.findById({ orderId });
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private readonly) {}
  canActivate(ctx: ExecutionContext): Promise<boolean> {}
}

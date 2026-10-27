import { SetMetadata } from '@nestjs/common';
import { AUTH_POLICY, AuthPolicy } from '../auth-policy';

export const RequiredAuth = () => SetMetadata(AUTH_POLICY, AuthPolicy.Required);
export const OptionalAuth = () => SetMetadata(AUTH_POLICY, AuthPolicy.Optional);
export const Public = () => SetMetadata(AUTH_POLICY, AuthPolicy.Public);

import { LineItems } from '@feature/common';
import { RegistrationRequest } from './registration-request';

export interface RegistrationRequestRepository {
  findById(id: string): Promise<RegistrationRequest | null>;
  create(data: RegistrationRequest): Promise<void>;
  list(): Promise<LineItems<RegistrationRequest>>;

  delete(id: string): Promise<void>;
}

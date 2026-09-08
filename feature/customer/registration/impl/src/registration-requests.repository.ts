import { LineItems } from '@feature/common';
import { RegistrationRequest } from './model/registration-request';

export interface RegistrationRequestRepository {
  find(id: string): Promise<RegistrationRequest | null>;
  create(data: Omit<RegistrationRequest, 'id'>): Promise<void>;
  list(): Promise<LineItems<RegistrationRequest>>;

  delete(id: string): Promise<void>;
}

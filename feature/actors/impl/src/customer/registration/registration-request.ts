import type { CustomerAddress } from '@feature/customer-address-api';
import type { TechnicianSpecialty } from '@feature/customer-api';

export type RegistrationRequest = {
  fullName: string;
  phoneNumber: string;
  address: Extract<CustomerAddress, { scope: 'intra_city' }>;
} & (
  | {
      type: 'merchant';
    }
  | {
      type: 'technician';
      specialty: TechnicianSpecialty;
    }
);

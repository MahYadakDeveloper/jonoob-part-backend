import { CustomerAddress } from '@feature/common';

export type RegistrationRequest = {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: CustomerAddress & { provinceId: number };
} & (
  | {
      type: 'merchant';
    }
  | {
      type: 'technician';
      technician: 'electrician' | 'mechanic';
    }
);

import { Wallet } from './wallet';

export type CustomerType = 'merchant' | 'consumer' | 'technician';

export type CustomerAddress = { id: string } & (
  | {
      scope: 'intra_city';
      coordinate?: {
        longitude: number;
        latitude: number;
      };
      cityId: number;
      address: string;
    }
  | {
      scope: 'inter_city';
      provinceId: number;
      cityId: number;
      address: string;
      postalCode: string;
    }
);

export type TechnicianSpecialty =
  | 'electrical'
  | 'mechanical'
  | 'body_repair'
  | 'painting'
  | 'tire_service'
  | 'detailing';

export type Customer = {
  id: string;
  fullName: string;
  phoneNumber: string;
  wallet: Wallet;
} & (
  | {
      type: Extract<CustomerType, 'consumer'>;
      addresses: Extract<CustomerAddress, { scope: 'inter_city' }>[];
    }
  | {
      type: Extract<CustomerType, 'merchant'>;
      addresses: Extract<CustomerAddress, { scope: 'intra_city' }>[];
    }
  | {
      type: Extract<CustomerType, 'technician'>;
      specialty: TechnicianSpecialty;
      addresses: Extract<CustomerAddress, { scope: 'intra_city' }>[];
    }
);

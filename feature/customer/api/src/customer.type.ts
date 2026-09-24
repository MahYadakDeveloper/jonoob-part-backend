import { CustomerAddress } from '@feature/customer-address-api';

export type CustomerType = 'merchant' | 'consumer' | 'technician';

type TechnicianSpecialty =
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
} & (
  | {
      type: Extract<CustomerType, 'consumer'>;
      addresses: ({ id: string } & Extract<
        CustomerAddress,
        { scope: 'inter_city' }
      >)[];
    }
  | {
      type: Extract<CustomerType, 'merchant'>;
      addresses: ({ id: string } & Extract<
        CustomerAddress,
        { scope: 'intra_city' }
      >)[];
    }
  | {
      type: Extract<CustomerType, 'technician'>;
      specialty: TechnicianSpecialty;
      addresses: ({ id: string } & Extract<
        CustomerAddress,
        { scope: 'intra_city' }
      >)[];
    }
);

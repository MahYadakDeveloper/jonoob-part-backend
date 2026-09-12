import { CustomerType } from '@feature/common';

export type AuthClaimsType = {
  customer: {
    id: string;
    phoneNumber: string;
    type: CustomerType;
  };
};

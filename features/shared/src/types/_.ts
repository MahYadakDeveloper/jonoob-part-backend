export type PricingPolicy = 'wholesale' | 'retail';

export type BankDestination = {
  cardNumber: string;
  firstName: string;
  lastName: string;
};

export type Duration = {
  value: number;
  unit: 'year' | 'month' | 'week' | 'hour' | 'minute';
};

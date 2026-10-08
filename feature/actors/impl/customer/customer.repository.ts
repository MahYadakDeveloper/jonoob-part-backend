export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByPhoneNumber(phoneNumber: string): Promise<Customer | null>;

  create(
    data: PartialBy<Customer, 'id' | 'wallet' | 'addresses'>,
  ): Promise<{ id: string }>;
}

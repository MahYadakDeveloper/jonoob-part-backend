export type AuthenticatedUser =
  | ({
      id: string;
    } & (
      | {
          role: 'customer';
        }
      | {
          role: 'courier';
        }
      | {
          role: 'manager';
        }
    ))
  | {
      role: 'admin';
    };

export type Admin = Extract<AuthenticatedUser, { role: 'admin' }>;
export type Manager = Extract<AuthenticatedUser, { role: 'manager' }>;
export type Courier = Extract<AuthenticatedUser, { role: 'courier' }>;
export type Customer = Extract<AuthenticatedUser, { role: 'customer' }>;

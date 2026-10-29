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

export type Role = AuthenticatedUser['role'];

// generic helper, replaces the four types in generic code
export type UserOf<R extends Role> = Extract<AuthenticatedUser, { role: R }>;

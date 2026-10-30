export type AuthenticatedUser = {
  id: string;
} & (
  | {
      role: 'admin';
    }
  | {
      role: 'manager';
    }
  | {
      role: 'courier';
    }
  | {
      role: 'customer';
    }
);

export type Role = AuthenticatedUser['role'];

// generic helper, replaces the four types in generic code
export type UserOf<R extends Role> = Extract<AuthenticatedUser, { role: R }>;

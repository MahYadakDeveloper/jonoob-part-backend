export type Role = 'admin' | 'manager' | 'courier' | 'customer';

export type AuthenticatedUser = {
  [R in Role]: {
    id: string;
    role: R;
  };
}[Role];

// generic helper, replaces the four types in generic code
export type UserOf<R extends Role> = Extract<AuthenticatedUser, { role: R }>;

import { defineAbility } from '@casl/ability';

export default (user: User) =>
  defineAbility((can, cannot) => {
    if (user.role !== 'customer') {
      can('read', 'Order');
      can('cancel', 'Order');
      return;
    }

    can('manage', 'Order', { customerId: user.id });
  });

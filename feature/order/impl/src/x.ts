export const CheckOrderPolicies = (...handlers: Type<PolicyHandler<OrderAbility>>[]) =>
  CheckPolicies<OrderAbility>({
    abilityFactory: OrderAbilityFactory,
    handlers,
  });

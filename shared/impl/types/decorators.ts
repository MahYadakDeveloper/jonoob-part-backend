/**
 * Maps database errors of every own method that returns a native Promise (i.e. `async` methods).
 * Sync methods and methods returning a Drizzle query builder are left untouched.
 */
export function DbErrors(rules: DbErrorRules): ClassDecorator {
  return (target) => {
    const proto = target.prototype as object;
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      const original: unknown = descriptor?.value;
      if (!descriptor || typeof original !== 'function') continue;

      descriptor.value = function (this: unknown, ...args: unknown[]) {
        const result: unknown = original.apply(this, args);
        if (!(result instanceof Promise)) return result;
        return result.catch((e: unknown) => {
          throw mapDbError(e, rules);
        });
      };
      Object.defineProperty(proto, key, descriptor);
    }
  };
}

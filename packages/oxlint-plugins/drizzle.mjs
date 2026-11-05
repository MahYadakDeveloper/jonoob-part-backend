const methodName = (call) =>
  call.callee.type === 'MemberExpression' &&
  !call.callee.computed &&
  call.callee.property.type === 'Identifier'
    ? call.callee.property.name
    : undefined;

const updateRequiresReturning = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Drizzle update().set() chains must call .returning()',
    },
    messages: {
      missing:
        'Drizzle update() without .returning(): a missing row is silently ignored. Add .returning() and check the result.',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (methodName(node) !== 'update') return;

        // walk up the chain: update(...) -> .set(...) -> .where(...) -> ...
        const names = [];
        let current = node;
        while (
          current.parent?.type === 'MemberExpression' &&
          current.parent.object === current &&
          current.parent.parent?.type === 'CallExpression' &&
          current.parent.parent.callee === current.parent
        ) {
          current = current.parent.parent;
          names.push(methodName(current));
        }

        // only Drizzle: update(table).set(...); skips crypto hash.update().digest()
        if (names[0] !== 'set') return;
        if (names.includes('returning')) return;

        context.report({ node, messageId: 'missing' });
      },
    };
  },
};

export default {
  meta: { name: 'drizzle' },
  rules: { 'update-requires-returning': updateRequiresReturning },
};

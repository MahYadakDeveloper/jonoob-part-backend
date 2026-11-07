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

// ---------------------------------------------------------------------------
// repository-requires-errors-decorator
//
// A concrete class that `implements <Something>Repository` must be decorated
// with @RepositoryErrors(...), otherwise persistence errors (unique, foreign
// key, ...) leak out of it as raw driver errors instead of domain errors.
//
// Options (all optional):
//   decorator         name of the required decorator   (default 'RepositoryErrors')
//   interfaceSuffix   suffix marking a repository interface (default 'Repository')
//   ignoreInterfaces  interface names that never require the decorator
//                     (e.g. a technical interface like 'DrizzleRepository')
//
// Abstract classes are skipped: the decorator only wraps OWN methods, so it
// belongs on the concrete class.
// ---------------------------------------------------------------------------

// Name of an expression used as a decorator or implemented type:
//   Foo, ns.Foo, Foo(...) -> 'Foo'
const expressionName = (expr) => {
  if (!expr) return undefined;
  switch (expr.type) {
    case 'Identifier':
      return expr.name;
    case 'CallExpression':
      return expressionName(expr.callee);
    case 'MemberExpression':
      return expr.computed ? undefined : expressionName(expr.property);
    case 'TSQualifiedName':
      return expr.right?.name;
    default:
      return undefined;
  }
};

const repositoryRequiresErrorsDecorator = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Classes implementing a repository interface must use the error-mapping decorator',
    },
    messages: {
      missing:
        'Class {{ className }} implements {{ interfaceName }} and must be decorated with @{{ decorator }}(...).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          decorator: { type: 'string' },
          interfaceSuffix: { type: 'string' },
          ignoreInterfaces: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {};
    const decorator = options.decorator ?? 'RepositoryErrors';
    const interfaceSuffix = options.interfaceSuffix ?? 'Repository';
    const ignored = new Set(options.ignoreInterfaces ?? []);

    const check = (node) => {
      if (node.abstract) return;

      const repositoryInterface = (node.implements ?? [])
        .map((impl) => expressionName(impl.expression))
        .find(
          (name) =>
            name !== undefined &&
            name.endsWith(interfaceSuffix) &&
            !ignored.has(name),
        );
      if (!repositoryInterface) return;

      const decorated = (node.decorators ?? []).some(
        (d) => expressionName(d.expression) === decorator,
      );
      if (decorated) return;

      context.report({
        node: node.id ?? node,
        messageId: 'missing',
        data: {
          className: node.id?.name ?? '(anonymous)',
          interfaceName: repositoryInterface,
          decorator,
        },
      });
    };

    return {
      ClassDeclaration: check,
      ClassExpression: check,
    };
  },
};

export default {
  meta: { name: 'drizzle' },
  rules: {
    'update-requires-returning': updateRequiresReturning,
    'repository-requires-errors-decorator': repositoryRequiresErrorsDecorator,
  },
};

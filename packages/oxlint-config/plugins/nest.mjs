// Custom oxlint JS plugin for NestJS controller conventions.

/** Returns the decorator name for `@Name` / `@Name(...)`, otherwise undefined. */
const decoratorName = (decorator) => {
  const expr = decorator.expression;
  if (expr?.type === 'CallExpression') return expr.callee?.name;
  if (expr?.type === 'Identifier') return expr.name;
  return undefined;
};

/**
 * Parameter decorators live on different nodes depending on the parameter shape: (@Body() dto) -> Identifier.decorators
 * (@Body() dto = {}) -> AssignmentPattern.left.decorators (private @Body() dto) ->
 * TSParameterProperty.parameter.decorators
 */
const paramDecorators = (param) =>
  param.decorators ??
  param.left?.decorators ??
  param.parameter?.decorators ??
  [];

const noBodyInGet = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow @Body() in controller methods decorated with read-only HTTP verbs (e.g. @Get). Use @Query() / @Param() instead.',
    },
    messages: {
      noBody:
        '@Body() is not allowed in a @{{ verb }} handler. A {{ verb }} request has no meaningful body; use @Query() or @Param() (or switch to POST for large/sensitive search criteria).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          // HTTP verb decorators that must not receive a body.
          methods: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const verbs = new Set(context.options[0]?.methods ?? ['Get']);

    return {
      MethodDefinition(node) {
        // Find the first read-only verb decorator on the method (e.g. @Get('x')).
        const verbDecorator = (node.decorators ?? []).find((d) =>
          verbs.has(decoratorName(d)),
        );
        if (!verbDecorator) return;
        const verb = decoratorName(verbDecorator);

        for (const param of node.value?.params ?? []) {
          for (const decorator of paramDecorators(param)) {
            if (decoratorName(decorator) === 'Body') {
              context.report({
                node: decorator,
                messageId: 'noBody',
                data: { verb },
              });
            }
          }
        }
      },
    };
  },
};

export default {
  meta: { name: 'nest' },
  rules: { 'no-body-in-get': noBodyInGet },
};

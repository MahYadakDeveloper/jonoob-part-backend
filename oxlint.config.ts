import { resolve } from 'node:path';
import { defineConfig } from 'oxlint';

const FEATURES = 'features';
const SHARED = 'shared';
const INFRASTRUCTURE = 'infrastructure';
const APPS = 'apps';

// A feature module path (a feature or a nested submodule) exposes one package
// per layer: features/<feature>/<submodule>/.../<layer>
const LAYERS = ['api', 'impl', 'http', 'ws'] as const;

type Layer = (typeof LAYERS)[number];
type Captured = Record<string, string | string[]>;

// Module path of the importing file, e.g. "store/order"
const OWN = '{{ from.file.captured.modulePath }}';

// Parent module path of the importing file, e.g. "store" for "store/order".
// Empty for a top-level feature (features/store has no parent), in which case
// the sibling pattern below degrades to "/*" and matches nothing.
const PARENT = '{{ from.file.captured.parentPath }}';

// Files of a category, optionally limited by captured values
const file = (category: string, captured?: Captured) => ({
  file: captured
    ? { categories: category, captured }
    : { categories: category },
});

// All files of a feature layer package, optionally limited to one module path
const f = (layer: Layer, captured?: Captured) => file(layer, captured);

// Only the public entry point (index.ts) of a feature layer package
const e = (layer: Layer, captured?: Captured) =>
  file(`${layer}-entry`, captured);

// ---------------------------------------------------------------------------
// Feature helpers
// ---------------------------------------------------------------------------

// api of the module the importing file belongs to
const OWN_API = e('api', { modulePath: OWN });
// api of the direct child modules only (one level below, never deeper)
const CHILD_APIS = e('api', { modulePath: `${OWN}/*` });
// api of the sibling modules only: same parent, one level
// (e.g. store/cart for store/order). Never the parent itself, never a
// module of another feature.
const SIBLING_APIS = e('api', { modulePath: `${PARENT}/*` });

// Top-level features (features/store, features/warehouse) have no parent, so
// SIBLING_APIS can't match them. Their siblings are the other top-level
// features: a module path of exactly one segment. `*` never crosses a "/",
// so nested modules (warehouse/stocks) are NOT matched.
const TOP_LEVEL = (layer: Layer) => f(layer, { modulePath: '*' });
const TOP_LEVEL_APIS = e('api', { modulePath: '*' });

const ANY_FEATURE = {
  element: { type: 'feature' },
  file: { categories: 'entry' },
};
const ANY_IMPL = e('impl');

// ---------------------------------------------------------------------------
// App and infrastructure helpers
// ---------------------------------------------------------------------------

const SAME_APP = {
  element: {
    type: 'app',
    captured: { app: '{{ from.element.captured.app }}' },
  },
};

const ANY_INFRASTRUCTURE = { element: { type: 'infrastructure' } };

const SAME_INFRASTRUCTURE_ROOT = {
  element: {
    type: 'infrastructure',
    captured: { root: '{{ from.element.captured.root }}' },
  },
};

// ---------------------------------------------------------------------------
// Shared helpers (shared/<name>: utils, types, error, http, ws)
// ---------------------------------------------------------------------------

const shared = (name: string | string[]) => ({
  element: { type: 'shared', captured: { name } },
});

const ANY_SHARED = { element: { type: 'shared' } };

// ---------------------------------------------------------------------------
// External packages and node built-ins
// ---------------------------------------------------------------------------

// Only npm packages and node built-ins. Internal modules imported through
// path aliases (@features/*, @shared/*, ...) resolve to local files and are
// governed by the element/file policies.
const EXTERNAL = { module: { origin: ['external', 'core'] } };

// A package plus all of its subpaths: pkg('drizzle-orm') matches
// 'drizzle-orm' and 'drizzle-orm/pg-core'. Globs work too: pkg('drizzle-*').
const pkg = (name: string) => [name, `${name}/**`];

// Libraries that may be allowed somewhere. Add new ones here.
const LIBS = {
  drizzle: pkg('drizzle-orm'),
  zod: pkg('zod'),
  nestCommon: pkg('@nestjs/common'),
};

// Files in these groups may import NO external package or node built-in,
// except the ones listed in `allow` (`core: true` also permits built-ins).
// A group with an empty `allow` may import no external code at all.
const EXTERNAL_RULES: { from: object[]; allow: string[]; core?: boolean }[] = [
  { from: [f('api')], allow: [] },
  { from: [f('impl')], allow: [...LIBS.zod, ...LIBS.drizzle] },
  { from: [f('http'), f('ws')], allow: [...LIBS.zod, ...LIBS.nestCommon] },
  { from: [shared('types'), shared('utils')], allow: [...LIBS.drizzle] },
];

// ---------------------------------------------------------------------------
// Violation message
// ---------------------------------------------------------------------------

// "features/<module path>" for feature files, "<type> <name>" for the rest
const describe = (side: 'from' | 'to') =>
  `{{#if ${side}.file.captured.modulePath}}${FEATURES}/{{ ${side}.file.captured.modulePath }}` +
  `{{else}}{{ ${side}.element.types.[0] }} {{ ${side}.element.captured.root }}` +
  `{{ ${side}.element.captured.name }}{{ ${side}.element.captured.app }}{{/if}}`;

const MESSAGE =
  `${describe('from')} must not import ` +
  `{{#if to.module.source}}{{ to.module.origin }} module {{ to.module.source }}` +
  `{{else}}${describe('to')}{{/if}}`;

// ---------------------------------------------------------------------------
// Policies (default: disallow, so every policy below is an allow list)
// ---------------------------------------------------------------------------

const policies = [
  // =========================================================================
  // Same package: a layer package may always import its own files.
  // This is the ONLY thing api may import (no shared, no other api, no libs).
  // =========================================================================
  ...LAYERS.map((layer) => ({
    from: f(layer),
    allow: { to: f(layer, { modulePath: OWN }) },
  })),

  // =========================================================================
  // impl / http / ws: the api (index.ts only) of
  //   - their own module
  //   - the direct child modules
  //   - the sibling modules (same parent)
  //
  // Top-level features additionally get the api of the other top-level
  // features (features/store -> features/warehouse/api), because they have
  // no parent module for SIBLING_APIS to work with.
  //
  // To keep siblings closed for a layer, drop SIBLING_APIS / the TOP_LEVEL
  // policy for that layer (e.g. split this block per layer).
  // =========================================================================
  ...(['impl', 'http', 'ws'] as const).flatMap((layer) => [
    { from: f(layer), allow: { to: [OWN_API, CHILD_APIS, SIBLING_APIS] } },
    { from: TOP_LEVEL(layer), allow: { to: TOP_LEVEL_APIS } },
  ]),

  // =========================================================================
  // Shared modules per layer
  // =========================================================================
  { from: f('api'), allow: { to: shared('types') } },
  { from: f('impl'), allow: { to: shared(['utils', 'types', 'error']) } },
  { from: f('http'), allow: { to: shared('http') } },
  { from: f('ws'), allow: { to: shared('ws') } },

  // =========================================================================
  // App: its own files plus everything nested in features, infrastructure
  // and shared
  // =========================================================================
  {
    from: { element: { type: 'app' } },
    allow: { to: [SAME_APP, ANY_FEATURE, ANY_INFRASTRUCTURE, ANY_SHARED] },
  },

  // =========================================================================
  // Infrastructure: its own root, shared, and every nested feature impl
  // =========================================================================
  {
    from: { element: { type: 'infrastructure' } },
    allow: { to: [SAME_INFRASTRUCTURE_ROOT, ANY_SHARED, ANY_IMPL] },
  },

  // =========================================================================
  // Shared: a module imports itself; utils -> types; http/ws -> error
  // =========================================================================
  {
    from: { element: { type: 'shared' } },
    allow: { to: shared('{{ from.element.captured.name }}') },
  },
  { from: shared('utils'), allow: { to: shared('types') } },
  { from: shared(['http', 'ws']), allow: { to: shared('error') } },

  // =========================================================================
  // External packages (the last matching policy wins): free everywhere,
  // then closed for every group in EXTERNAL_RULES, then reopened per `allow`
  // =========================================================================
  { allow: { to: EXTERNAL } },
  ...EXTERNAL_RULES.flatMap(({ from }) =>
    from.map((group) => ({ from: group, disallow: { to: EXTERNAL } })),
  ),
  ...EXTERNAL_RULES.flatMap(({ from, allow, core }) =>
    from.flatMap((group) => [
      ...(allow.length > 0
        ? [
            {
              from: group,
              allow: { to: { module: { origin: 'external', source: allow } } },
            },
          ]
        : []),
      ...(core
        ? [{ from: group, allow: { to: { module: { origin: 'core' } } } }]
        : []),
    ]),
  ),
];

export default defineConfig({
  jsPlugins: [
    { name: 'boundaries', specifier: 'eslint-plugin-boundaries' },
    { name: 'drizzle', specifier: './.tools/oxlint-plugins/drizzle.mjs' },
    { name: 'nest', specifier: './.tools/oxlint-plugins/nest.mjs' },
    // The global Array.toMap augmentation makes array literals unassignable
  ] as never,

  settings: {
    'boundaries/root-path': resolve(import.meta.dirname),

    // All TypeScript files of the modules (config files live in the root)
    'boundaries/include': [
      `${APPS}/*/**/*.ts`,
      `${FEATURES}/**/*.ts`,
      `${INFRASTRUCTURE}/**/*.ts`,
      `${SHARED}/**/*.ts`,
    ],

    'boundaries/ignore': ['**/*.{test,spec}.ts'],

    'boundaries/legacy-templates': false,

    // -----------------------------------------------------------------------
    // Elements
    // -----------------------------------------------------------------------
    'boundaries/elements': [
      {
        type: 'app',
        pattern: `${APPS}/*`,
        partialMatch: false,
        capture: ['app'],
      },
      {
        type: 'feature',
        pattern: `${FEATURES}/*`,
        partialMatch: false,
        capture: ['root'],
      },
      {
        type: 'infrastructure',
        pattern: `${INFRASTRUCTURE}/*`,
        partialMatch: false,
        capture: ['root'],
      },
      {
        type: 'shared',
        pattern: `${SHARED}/*`,
        partialMatch: false,
        capture: ['name'],
      },
    ],

    // -----------------------------------------------------------------------
    // File categories
    // -----------------------------------------------------------------------
    'boundaries/files': [
      // Feature layers: features/<modulePath>/<layer>/**
      ...LAYERS.map((layer) => ({
        pattern: `${FEATURES}/**/${layer}/**`,
        category: layer,
        capture: ['modulePath'],
      })),

      // Public entry point of every layer package:
      // features/<modulePath>/<layer>/index.ts
      ...LAYERS.map((layer) => ({
        pattern: `${FEATURES}/**/${layer}/index.ts`,
        category: `${layer}-entry`,
        capture: ['modulePath'],
      })),

      // Any layer entry point (for app -> feature)
      ...LAYERS.map((layer) => ({
        pattern: `${FEATURES}/**/${layer}/index.ts`,
        category: 'entry',
      })),

      // Parent module path of every layer file (for sibling access):
      // features/<parentPath>/<name>/<layer>/**
      // Only the first `**` is captured; the `*` is the module's own name.
      // A top-level feature (features/store/impl) yields an empty parentPath.
      ...LAYERS.map((layer) => ({
        pattern: `${FEATURES}/**/*/${layer}/**`,
        category: layer,
        capture: ['parentPath'],
      })),
    ],

    'import/resolver': {
      oxc: {
        tsconfig: { configFile: './tsconfig.json', references: 'auto' },
        extensions: ['.ts'],
      },
    },
  },

  rules: {
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        checkAllOrigins: true,
        checkInternals: true,
        message: MESSAGE,
        policies,
      },
    ],

    'boundaries/no-unknown-dependencies': 'error',

    'typescript/no-explicit-any': 'off',
    'typescript/no-floating-promises': 'error',
  },

  categories: { correctness: 'error' },

  env: { node: true, es2022: true },

  ignorePatterns: ['**/node_modules'],

  options: { typeAware: true, reportUnusedDisableDirectives: 'warn' },
});

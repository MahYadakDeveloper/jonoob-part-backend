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

const OWN = '{{ from.file.captured.modulePath }}';
const PARENT = '{{ from.file.captured.parentPath }}';
const ROOT = '{{ from.element.captured.root }}';

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

const OWN_API = e('api', { modulePath: OWN });
// One level below only: the submodule becomes the context of this impl
const CHILD_APIS = e('api', { modulePath: `${OWN}/*` });
// Same parent module only, never anything above it
const SIBLING_APIS = e('api', { modulePath: `${PARENT}/*` });
// Root-level api of every OTHER feature, never the api of its submodules
const OTHER_FEATURE_APIS = {
  element: { type: 'feature', captured: { root: `!${ROOT}` } },
  file: { categories: 'api-entry', captured: { modulePath: '*' } },
};

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
// governed by the element/file policies above.
const EXTERNAL = { module: { origin: ['external', 'core'] } };

// impl may only use these npm libraries
const IMPL_EXTERNALS = ['@nestjs/common', '@nestjs/drizzle', 'drizzle-*'];

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
  // Same package: a layer package may always import its own files
  // =========================================================================
  ...LAYERS.map((layer) => ({
    from: f(layer),
    allow: { to: f(layer, { modulePath: OWN }) },
  })),

  // =========================================================================
  // api: its own package only (covered above). No shared, no other layers.
  // =========================================================================

  // =========================================================================
  // impl: own api, child apis (one level lower), sibling apis (same parent),
  // root-level apis of other features, and utils/types/error of shared
  // =========================================================================
  {
    from: f('impl'),
    allow: {
      to: [
        OWN_API,
        CHILD_APIS,
        SIBLING_APIS,
        OTHER_FEATURE_APIS,
        shared(['utils', 'types', 'error']),
      ],
    },
  },

  // =========================================================================
  // http / ws: own api and the matching shared module only
  // =========================================================================
  { from: f('http'), allow: { to: [OWN_API, shared('http')] } },
  { from: f('ws'), allow: { to: [OWN_API, shared('ws')] } },

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
  // External packages (the last matching policy wins): free everywhere
  // except impl, which may only use IMPL_EXTERNALS
  // =========================================================================
  { allow: { to: EXTERNAL } },
  { from: f('impl'), disallow: { to: EXTERNAL } },
  {
    from: f('impl'),
    allow: { to: { module: { origin: 'external', source: IMPL_EXTERNALS } } },
  },
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

      // parentPath / moduleName, merged into the same captured object
      ...LAYERS.map((layer) => ({
        pattern: `${FEATURES}/**/*/${layer}/**`,
        category: 'module-path',
        capture: ['parentPath', 'moduleName'],
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

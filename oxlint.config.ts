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

// Files of a feature layer package, optionally limited to one module path
const f = (layer: Layer, captured?: Captured) => ({
  file: captured ? { categories: layer, captured } : { categories: layer },
});

// ---------------------------------------------------------------------------
// Feature helpers
// ---------------------------------------------------------------------------

const OWN_API = f('api', { modulePath: OWN });
// One level below only: the submodule becomes the context of this impl
const CHILD_APIS = f('api', { modulePath: `${OWN}/*` });
// Same parent module only, never anything above it
const SIBLING_APIS = f('api', { modulePath: `${PARENT}/*` });
// Root-level api of every OTHER feature, never the api of its submodules
const OTHER_FEATURE_APIS = {
  element: { type: 'feature', captured: { root: `!${ROOT}` } },
  file: { categories: 'api', captured: { modulePath: '*' } },
};

const ANY_FEATURE = { element: { type: 'feature' } };
const ANY_IMPL = f('impl');

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

// "features/<package path>" for feature files, "<type> <name>" for the rest
const describe = (side: 'from' | 'to') =>
  `{{#if ${side}.file.captured.packagePath}}${FEATURES}/{{ ${side}.file.captured.packagePath }}` +
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
  // Same package: a package may always import its own files
  // =========================================================================
  {
    from: { file: { categories: 'package' } },
    allow: {
      to: {
        file: {
          categories: 'package',
          captured: { packagePath: '{{ from.file.captured.packagePath }}' },
        },
      },
    },
  },

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

    // Only real source files (no tsup.config.ts, etc.)
    'boundaries/include': [
      `${APPS}/*/src/**/*.ts`,
      `${FEATURES}/**/src/**/*.ts`,
      `${INFRASTRUCTURE}/**/src/**/*.ts`,
      `${SHARED}/**/src/**/*.ts`,
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
      // Feature layers: features/<modulePath>/<layer>/src/**
      ...LAYERS.map((layer) => ({
        pattern: `${FEATURES}/**/${layer}/src/**`,
        category: layer,
        capture: ['modulePath'],
      })),

      // parentPath / moduleName, merged into the same captured object
      ...LAYERS.map((layer) => ({
        pattern: `${FEATURES}/**/*/${layer}/src/**`,
        category: 'module-path',
        capture: ['parentPath', 'moduleName'],
      })),

      // Any feature package, also the ones that are not a known layer yet
      {
        pattern: `${FEATURES}/**/src/**`,
        category: 'package',
        capture: ['packagePath'],
      },
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

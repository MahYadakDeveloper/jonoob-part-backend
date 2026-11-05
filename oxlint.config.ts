import { resolve } from 'node:path';
import { defineConfig } from 'oxlint';

const FEATURES = 'feature';
const SHARED = 'shared';
const INFRASTRUCTURE = 'infrastructure';
const APP = 'app';

const LAYERS = ['api', 'impl', 'http', 'schema', 'error'] as const;
// Layers that may contain a Nest *.module.ts file
const MODULE_LAYERS = ['impl', 'http'] as const;

type Layer = (typeof LAYERS)[number];
type FileCategory =
  | Layer
  | 'module'
  | 'app-module'
  | 'app-entry'
  | 'infra-module';
type Captured = Record<string, string>;

const OWN = '{{ from.file.captured.modulePath }}';
const PARENT = '{{ from.file.captured.parentPath }}';
const ROOT = '{{ from.element.captured.root }}';

const f = (categories: FileCategory | FileCategory[], captured?: Captured) => ({
  file: captured ? { categories, captured } : { categories },
});

// ---------------------------------------------------------------------------
// Feature helpers
// ---------------------------------------------------------------------------

// Layer of OTHER root features: any depth, or only the feature-root level ('*')
const otherRoot = (category: FileCategory, modulePath?: string) => ({
  element: { type: 'feature', captured: { root: `!${ROOT}` } },
  file: modulePath
    ? { categories: category, captured: { modulePath } }
    : { categories: category },
});

// api visibility shared by impl and http
const apiTargets = () => [
  f('api', { modulePath: OWN }), // own api
  f('api', { modulePath: `${OWN}/*` }), // immediate child submodules
  f('api', { modulePath: `${PARENT}/*` }), // sibling submodules
  otherRoot('api', '*'), // other features: root level only
];

// Root-level module files of any feature (used by app)
const FEATURE_ROOT_MODULE = {
  element: { type: 'feature' },
  file: { categories: 'module', captured: { modulePath: '*' } },
};

// ---------------------------------------------------------------------------
// Infrastructure helpers
// ---------------------------------------------------------------------------

const ANY_INFRA_MODULE = {
  element: { type: 'infrastructure' },
  file: { categories: 'infra-module' },
};

const INFRA_ROOT_MODULE = {
  element: { type: 'infrastructure' },
  file: { categories: 'infra-module', captured: { modulePath: '*' } },
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const shared = (name: string) => ({
  element: { type: 'shared', captured: { name } },
});

const ANY_SHARED = { element: { type: 'shared' } };
const SHARED_NO_HTTP_ERROR = shared('!(http|error)');

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

const policies = [
  // =========================================================================
  // Same layer -> same module (api->api, impl->impl, ... inside one module)
  // =========================================================================
  ...LAYERS.map((layer) => ({
    from: f(layer),
    allow: { to: f(layer, { modulePath: OWN }) },
  })),

  // =========================================================================
  // api: only its own layer (covered above). No shared, no other layers.
  // =========================================================================

  // =========================================================================
  // Feature modules (*.module.ts inside impl/http)
  // =========================================================================
  {
    from: f('module'),
    allow: {
      to: [
        // Own layers
        f('api', { modulePath: OWN }),
        f('impl', { modulePath: OWN }),
        f('http', { modulePath: OWN }),
        f('schema', { modulePath: OWN }),
        f('error', { modulePath: OWN }),

        // Other module files of the same module (http.module -> impl.module)
        f('module', { modulePath: OWN }),

        // Child feature modules
        f('module', { modulePath: `${OWN}/*` }),

        // Infrastructure modules (root and nested)
        ANY_INFRA_MODULE,

        // Shared
        ANY_SHARED,
      ],
    },
  },

  // =========================================================================
  // App modules: wiring only root feature / root infra modules
  // =========================================================================
  {
    from: f('app-module'),
    allow: { to: [FEATURE_ROOT_MODULE, INFRA_ROOT_MODULE] },
  },

  // app entry (main.ts)
  { from: f('app-entry'), allow: { to: [f('app-module'), ANY_SHARED] } },

  // =========================================================================
  // Infrastructure
  // =========================================================================
  {
    from: f('infra-module'),
    allow: {
      to: [
        f('infra-module', { modulePath: `${OWN}/*` }), // child infra modules
        ANY_SHARED,
      ],
    },
  },

  // any file inside an infrastructure root: itself + shared
  {
    from: { element: { type: 'infrastructure' } },
    allow: {
      to: [
        {
          element: {
            type: 'infrastructure',
            captured: { root: '{{ from.element.captured.root }}' },
          },
        },
        ANY_SHARED,
      ],
    },
  },

  // =========================================================================
  // Schema
  // =========================================================================

  // schema -> api (type-only)
  {
    from: f('schema'),
    allow: {
      to: [
        f('api', { modulePath: OWN }),
        f('api', { modulePath: `${PARENT}/*` }),
        otherRoot('api', '*'),
      ],
      dependency: { kind: 'type' },
    },
  },

  // schema -> schema (value imports: Drizzle references/relations)
  // own schema comes from the same-layer policy
  {
    from: f('schema'),
    allow: {
      to: [
        f('schema', { modulePath: `${OWN}/*` }), // one level below
        f('schema', { modulePath: `${PARENT}/*` }), // same-level siblings
      ],
    },
  },

  // =========================================================================
  // Impl
  // =========================================================================
  {
    from: f('impl'),
    allow: {
      to: [
        ...apiTargets(),
        f('schema', { modulePath: OWN }),
        f('error', { modulePath: OWN }),
        SHARED_NO_HTTP_ERROR,
      ],
    },
  },

  // =========================================================================
  // HTTP (like impl, but no schema, and access to all shared/*)
  // =========================================================================
  {
    from: f('http'),
    allow: {
      to: [...apiTargets(), f('error', { modulePath: OWN }), ANY_SHARED],
    },
  },

  // =========================================================================
  // Error
  // =========================================================================
  {
    from: f('error'),
    allow: {
      to: [
        otherRoot('error', '*'), // root-level errors of other features
        shared('error'),
      ],
    },
  },

  // =========================================================================
  // Shared: may import itself only
  // =========================================================================
  {
    from: { element: { type: 'shared' } },
    allow: { to: shared('{{ from.element.captured.name }}') },
  },
];

export default defineConfig({
  jsPlugins: [
    'eslint-plugin-boundaries',
    './packages/oxlint-plugins/drizzle.mjs',
    './packages/oxlint-plugins/nest.mjs',
  ],

  settings: {
    'boundaries/root-path': resolve(import.meta.dirname),

    // Only real source files (no tsup.config.ts, etc.)
    'boundaries/include': [
      `${APP}/*.ts`,
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
      // Files directly under app/ (folder mode would not match them)
      {
        type: 'app',
        pattern: `${APP}/*.ts`,
        mode: 'file',
        partialMatch: false,
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
      // Feature layers: feature/<modulePath>/<layer>/src/**
      ...LAYERS.map((layer) => ({
        pattern: `${FEATURES}/**/${layer}/src/**`,
        category: layer,
        capture: ['modulePath'],
      })),

      // parentPath / moduleName, merged into the same captured object
      {
        pattern: `${FEATURES}/**/*/{${LAYERS.join(',')}}/**`,
        category: 'module-file',
        capture: ['parentPath', 'moduleName'],
      },

      // Feature Nest modules: start from the layer folder, so modulePath
      // is identical to the layer files of the same module
      ...MODULE_LAYERS.map((layer) => ({
        pattern: `${FEATURES}/**/${layer}/src/**/*.module.ts`,
        category: 'module',
        capture: ['modulePath'],
      })),

      // App: one level only
      { pattern: `${APP}/*.module.ts`, category: 'app-module' },
      { pattern: `${APP}/main.ts`, category: 'app-entry' },

      // Infrastructure Nest modules: infrastructure/<modulePath>/src/**
      {
        pattern: `${INFRASTRUCTURE}/**/src/**/*.module.ts`,
        category: 'infra-module',
        capture: ['modulePath'],
      },
    ],

    'import/resolver': {
      oxc: { tsconfig: { configFile: './tsconfig.json', references: 'auto' } },
    },
  },

  rules: {
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        checkInternals: true,
        message:
          '{{ from.file.categories }} ({{ from.file.captured.modulePath }}) must not import {{ to.file.categories }} ({{ to.file.captured.modulePath }})',
        policies,
      },
    ],

    'boundaries/no-unknown-dependencies': 'error',

    'typescript/no-explicit-any': 'off',
    'typescript/no-floating-promises': 'error',

    'no-unused-vars': ['error', { fix: { imports: 'safe-fix' } }],
  },

  categories: { correctness: 'error' },

  env: { node: true, es2022: true },

  ignorePatterns: ['**/node_modules'],

  options: { typeAware: true, reportUnusedDisableDirectives: 'warn' },
});

#!/usr/bin/env bun
/**
 * @example
 *   Scaffold a feature api + impl pair.
 *
 *   bun run scripts/make-api-module.ts <x>                -> <features>/<x>/{api,impl}
 *   bun run scripts/make-api-module.ts <x> -g <y>         -> <features>/<y>/<x>/{api,impl}
 *   bun run scripts/make-api-module.ts <y>/<x>            -> same as above
 *   bun run scripts/make-api-module.ts <a>/<b>/<c>/<x>    -> <features>/<a>/<b>/<c>/<x>/{api,impl}
 *   bun run scripts/make-api-module.ts <x> -g <a>/<b>/<c> -> same as above
 *
 *   Package names are @feature/<x>-api and @feature/<x>-impl (groups are
 *   folder-only, same as make-errors-module.ts). The errors package
 *   @feature/<x>-errors is the one made by make-errors-module.ts.
 *
 *   Options:
 *   -g, --group <y>     optional group path, nesting allowed with "/" (folders only)
 *   --features-dir <p>  features folder relative to repo root (default: feature)
 *   --no-install        skip `bun install --filter`
 *   --dry-run           print what would be written, write nothing
 *   --force             overwrite existing api/impl folders
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

// ------------------------------------------------------------------ config
const DEFAULT_FEATURES_DIR = 'feature';
// Root tsconfig, relative to the repo root.
const ROOT_TSCONFIG = 'tsconfig.json';

// ------------------------------------------------------------------ naming
interface Names {
  kebab: string;
  pascal: string;
  camel: string;
}

function toNames(input: string): Names {
  const words = input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

  if (words.length === 0 || /^\d/.test(words[0] ?? '')) {
    throw new Error(`Invalid name: "${input}"`);
  }

  const pascal = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  return {
    kebab: words.join('-'),
    pascal,
    camel: pascal.charAt(0).toLowerCase() + pascal.slice(1),
  };
}

// ------------------------------------------------------------------ repo
function findRepoRoot(from: string): string {
  let dir = resolve(from);

  while (true) {
    const pkg = join(dir, 'package.json');

    if (existsSync(pkg)) {
      const json = JSON.parse(readFileSync(pkg, 'utf8')) as {
        workspaces?: unknown;
      };
      if (json.workspaces) return dir;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        'Could not find the monorepo root (package.json with "workspaces").',
      );
    }
    dir = parent;
  }
}

async function workspaceHasPackage(
  featuresDir: string,
  name: string,
): Promise<boolean> {
  const glob = new Bun.Glob('**/package.json');

  for await (const file of glob.scan({ cwd: featuresDir })) {
    if (file.includes('node_modules')) continue;

    const json = JSON.parse(readFileSync(join(featuresDir, file), 'utf8')) as {
      name?: string;
    };
    if (json.name === name) return true;
  }

  return false;
}

// ------------------------------------------------------------------ args
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    group: { type: 'string', short: 'g' },
    'features-dir': { type: 'string' },
    'no-install': { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
  },
});

const USAGE = 'Usage: bun run scripts/make-api-module.ts <x> [-g <y>]';

const rawInput = positionals[0];
if (!rawInput) {
  console.error(USAGE);
  process.exit(1);
}

const splitPath = (s: string) =>
  s
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

// "a/b/c/x" -> groups [a, b, c], name x
const inputParts = splitPath(rawInput);
const rawName = inputParts.pop();
if (!rawName) {
  console.error(USAGE);
  process.exit(1);
}

// -g wins over groups embedded in the positional path.
const rawGroups = values.group ? splitPath(values.group) : inputParts;

const x = toNames(rawName);
const groupKebabs = rawGroups.map((g) => toNames(g).kebab);

const repoRoot = findRepoRoot(import.meta.dir);
const featuresDir = resolve(
  repoRoot,
  values['features-dir'] ?? DEFAULT_FEATURES_DIR,
);

const apiPkgName = `@feature/${x.kebab}-api`;
const implPkgName = `@feature/${x.kebab}-impl`;
const errorsPkgName = `@feature/${x.kebab}-errors`;

const moduleDir = join(featuresDir, ...groupKebabs, x.kebab);
const apiDir = join(moduleDir, 'api');
const implDir = join(moduleDir, 'impl');

// api and impl sit at the same depth, so one relative path serves both.
const tsconfigExtends = relative(
  apiDir,
  join(repoRoot, ROOT_TSCONFIG),
).replaceAll('\\', '/');

// ------------------------------------------------------------------ helpers
const FENCE = '`'.repeat(3);

/**
 * Wraps text in a JSDoc block. Throws if the body would close the comment early, so a bad sample fails at generation
 * time, not in the generated module.
 */
function jsdoc(body: string): string {
  if (body.includes('*/')) {
    throw new Error('JSDoc sample must not contain "*/"');
  }
  const lines = body
    .replace(/\n+$/, '')
    .split('\n')
    .map((line) => (line ? ` * ${line}` : ' *'));
  return ['/**', ...lines, ' */'].join('\n');
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

// ------------------------------------------------------------------ templates
const P = x.pascal;
const c = x.camel;
const k = x.kebab;
const U = x.kebab.replaceAll('-', '_').toUpperCase();

const schemaImport = `@infra/schema/${[...groupKebabs, k].join('/')}.schema`;
const errorsImport = `${errorsPkgName}/${k}.errors`;

// ================================================================== api
const apiDoc =
  jsdoc(`Public contract of ${k}. Other features depend on this package only
(never on ${implPkgName}) and inject it with the ${U}_API token.

Errors: every method documents the domain errors it may throw. They are the
errors of ${errorsPkgName} (import from '${errorsImport}'),
the same ones ${P}Impl throws at runtime, so callers can catch them by class.
Category errors (NotFound, Conflict, Forbidden, BusinessRuleViolation) are
mapped to HTTP statuses automatically by the http-error module.

Sample (reference only, do not uncomment as is; rename "y" to the real method):

@example
${FENCE}ts
// 1. Contract: declare the method and list its errors in a JSDoc block above
//    it. Shown with // here because a JSDoc block cannot be nested in a comment.
//
//    Does something with a ${P}.
//    @throws ${P}NotFoundError             404, the ${P} does not exist
//    @throws ${P}DuplicateError            409, a ${P} with the same key exists
//    @throws NotAllowedTo${P}Error         403, the caller may not do this
//    @throws ${P}InvalidStateError         422, the ${P} is in the wrong state
//    @throws ${P}PreconditionFailedError   custom mapping, see ${U}_ERROR_MAPPINGS
export interface ${P}Api {
  y(input: { id: string }): Promise<void>;
}

// 2. Usage: inject by token and catch the typed errors you can handle.
import { Inject, Injectable } from '@nestjs/common';
import { ${P}NotFoundError } from '${errorsImport}';
import { ${U}_API, ${P}Api } from '${apiPkgName}';

@Injectable()
export class SomeConsumer {
  constructor(@Inject(${U}_API) private readonly ${c}: ${P}Api) {}

  async run(id: string): Promise<void> {
    try {
      await this.${c}.y({ id });
    } catch (error) {
      if (error instanceof ${P}NotFoundError) {
        // expected business error: handle it
        return;
      }
      // anything else keeps bubbling up to the error filter
      throw error;
    }
  }
}
${FENCE}`);

const apiSource = `export const ${U}_API = Symbol('${U}_API');

${apiDoc}
export interface ${P}Api {}
`;

const apiFiles: Record<string, string> = {
  [`src/${k}.api.ts`]: apiSource,

  'src/index.ts': `export * from './${k}.api';
`,

  '.oxlintrc.json': json({
    extends: ['./node_modules/@repo/oxlint-config/api.json'],
  }),

  'tsconfig.json': json({ extends: tsconfigExtends }),

  'package.json': json({
    name: apiPkgName,
    type: 'commonjs',
    exports: { '.': './src/index.ts' },
    private: true,
    dependencies: {
      [errorsPkgName]: 'workspace:*',
      '@feature/shared': 'workspace:*',
      '@infra/schema': 'workspace:*',
    },
    devDependencies: {
      '@repo/oxlint-config': 'workspace:*',
    },
  }),
};

// ================================================================== impl
const implDoc =
  jsdoc(`Implementation of ${P}Api. Every method only delegates to its command.
The errors a method throws are the ones documented on ${P}Api.

Sample (reference only, do not uncomment as is):

@example
${FENCE}ts
import { InputOf } from '@feature/shared/cqrs';

y = (input: InputOf<${P}Api, 'y'>) => this.cmds.y.execute(input);
${FENCE}`);

const implSource = `import { ${P}Api } from '${apiPkgName}';
import { Injectable } from '@nestjs/common';

import { ${P}Commands } from './commands/${k}.commands';

${implDoc}
@Injectable()
export class ${P}Impl implements ${P}Api {
  constructor(private readonly cmds: ${P}Commands) {}
}
`;

const commandsDoc =
  jsdoc(`One property per ${P}Api method, each injected with its command class.
Every command class must also be registered in ${P}ImplModule providers.

Sample (reference only, do not uncomment as is):

@example
${FENCE}ts
import { type CommandOf } from '@feature/shared/cqrs';
import { Inject } from '@nestjs/common';
import { YCommand } from './y.command';

@Inject(YCommand)
readonly y: CommandOf<${P}Api, 'y'>;
${FENCE}`);

const commandsSource = `import { CommandsOf } from '@feature/shared/cqrs';
import { ${P}Api } from '${apiPkgName}';
import { Injectable } from '@nestjs/common';

${commandsDoc}
@Injectable()
export class ${P}Commands implements CommandsOf<${P}Api> {}
`;

const sampleCommandDoc =
  jsdoc(`Sample command for the "y" method of ${P}Api. This is only a reference:
copy it to a real file (for example y.command.ts), adapt it, then register it
in ${P}Commands and in ${P}ImplModule providers.

Errors thrown here must be the ones documented on ${P}Api and come from
${errorsPkgName}.

@example
${FENCE}ts
import { CommandOf, InputOf, OutputOf } from '@feature/shared/cqrs';
import { ${P}Api } from '${apiPkgName}';
import { ${P}NotFoundError } from '${errorsImport}';
import { DrizzleTransactionAls } from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import { ${P}Repository } from '../${k}.repository';

@Injectable()
export class YCommand implements CommandOf<${P}Api, 'y'> {
  constructor(
    private readonly repository: ${P}Repository,
    private readonly tx: DrizzleTransactionAls,
  ) {}

  execute(input: InputOf<${P}Api, 'y'>): OutputOf<${P}Api, 'y'> {
    return this.tx.run(async (lock) => {
      const ${c} = await lock('update', async () =>
        this.repository.find(...),
      );
      if (!${c}) throw new ${P}NotFoundError(input.id);
      // ...
    });
  }
}
${FENCE}`);

const repositoryDoc =
  jsdoc(`Persistence for ${k}. Only the repository talks to the database; commands
use it. DB errors are mapped to domain errors from ${errorsPkgName};
errors of other features come from their own errors package.

Sample (reference only, do not uncomment as is; adapt to the real schema and
errors, and remove what you do not use):

@example
${FENCE}ts
// ---- imports
import { StrictOmit } from '@feature/shared/types/utils';
import {
  ${P}DuplicateError,
  ${P}InvalidStateError,
  ${P}NotFoundError,
} from '${errorsImport}';
import { DbErrors, DrizzleBaseRepository, onFk, onPk } from '@infra/db-drizzle';
import { ${U}_CHECKS, ${c}, ${c}Items } from '${schemaImport}';
import { Injectable } from '@nestjs/common';

// ---- input type of a create operation (parent row + child rows)
type Create${P} = StrictOmit<typeof ${c}.$inferInsert, 'id'> & {
  items: StrictOmit<typeof ${c}Items.$inferInsert, '${c}Id'>[];
};

// ---- class with DB error mapping
@Injectable()
@DbErrors({
  constraints: {
    // foreign key violation -> domain error built from the row values
    ...onFk(
      ${c}Items,
      '${c}Id',
      ({ ${c}Id }) => new ${P}NotFoundError(${c}Id),
    ),
    // primary key violation -> domain error
    ...onPk(${c}Items, ${P}DuplicateError),
    // check constraint name -> domain error
    [${U}_CHECKS.someRule]: ${P}InvalidStateError,
  },
  // error kinds -> domain error (import MalformedInputError from where it lives)
  kinds: { invalidInput: MalformedInputError },
})
export class ${P}Repository extends DrizzleBaseRepository {}
${FENCE}`);

const repositorySource = `import { DrizzleBaseRepository } from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';

${repositoryDoc}
@Injectable()
export class ${P}Repository extends DrizzleBaseRepository {}
`;

const moduleSource = `import { ${U}_API } from '${apiPkgName}';
import { DrizzleDbModule, DrizzleOutboxModule } from '@infra/db-drizzle';
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';

import { ${P}Commands } from './commands/${k}.commands';
import { ${P}Impl } from './${k}.impl';
import { ${P}Repository } from './${k}.repository';

@Module({
  imports: [DrizzleDbModule, DrizzleOutboxModule],
  providers: [
    ${P}Impl,
    ${P}Commands,
    ${P}Repository,
    // Register every command class here, e.g. YCommand,
    {
      provide: ${U}_API,
      useExisting: ${P}Impl,
    },
  ],
  exports: [${U}_API],
})
export class ${P}ImplModule {
  static forRoot(options: ModuleMetadata): DynamicModule {
    return {
      module: ${P}ImplModule,
      ...options,
    };
  }
}
`;

const implFiles: Record<string, string> = {
  [`src/${k}.impl.ts`]: implSource,
  [`src/commands/${k}.commands.ts`]: commandsSource,
  'src/commands/sample.command.ts': `${sampleCommandDoc}

export {};
`,
  [`src/${k}.repository.ts`]: repositorySource,
  [`src/${k}.impl.module.ts`]: moduleSource,

  'src/index.ts': `export * from './${k}.impl.module';
`,

  '.oxlintrc.json': json({
    extends: ['./node_modules/@repo/oxlint-config/impl.json'],
  }),

  'tsconfig.json': json({ extends: tsconfigExtends }),

  'package.json': json({
    name: implPkgName,
    type: 'commonjs',
    exports: { '.': './src/index.ts' },
    private: true,
    dependencies: {
      [errorsPkgName]: 'workspace:*',
      [apiPkgName]: 'workspace:*',
      '@feature/shared': 'workspace:*',
      '@infra/db-drizzle': 'workspace:*',
      '@infra/schema': 'workspace:*',
      '@nestjs/common': 'catalog:',
      'drizzle-orm': 'catalog:',
    },
    devDependencies: {
      '@repo/oxlint-config': 'workspace:*',
    },
  }),
};

// ------------------------------------------------------------------ run
const packages = [
  { name: apiPkgName, dir: apiDir, files: apiFiles },
  { name: implPkgName, dir: implDir, files: implFiles },
];

const rel = (p: string) => relative(repoRoot, p).replaceAll('\\', '/');

for (const pkg of packages) {
  console.log(`package : ${pkg.name}`);
  console.log(`folder  : ${rel(pkg.dir)}`);
}
console.log(`errors  : ${errorsPkgName} (${errorsImport})`);
console.log(`tsconfig: extends ${tsconfigExtends}`);

if (!existsSync(join(repoRoot, ROOT_TSCONFIG))) {
  console.warn(
    `! ${ROOT_TSCONFIG} not found in repo root; check the "extends" path.`,
  );
}

const existing = packages.filter((pkg) => existsSync(pkg.dir));
if (existing.length > 0 && !values.force) {
  for (const pkg of existing) {
    console.error(
      `\n${rel(pkg.dir)} already exists. Use --force to overwrite.`,
    );
  }
  process.exit(1);
}

if (values['dry-run']) {
  console.log('\n[dry-run] files:');
  for (const pkg of packages) {
    for (const file of Object.keys(pkg.files)) {
      console.log(`  ${rel(join(pkg.dir, file))}`);
    }
  }
  process.exit(0);
}

for (const pkg of packages) {
  for (const [file, content] of Object.entries(pkg.files)) {
    await Bun.write(join(pkg.dir, file), content);
    console.log(`+ ${rel(join(pkg.dir, file))}`);
  }
}

if (values['no-install']) {
  console.log('\nSkipped install (--no-install).');
  process.exit(0);
}

const filters = packages.flatMap((pkg) => ['--filter', pkg.name]);

if (!(await workspaceHasPackage(featuresDir, errorsPkgName))) {
  console.warn(
    `\n! Workspace package ${errorsPkgName} was not found, so install was skipped.` +
      `\n  Create it (make-errors-module.ts), then run: bun install ${filters
        .map((f) => (f === '--filter' ? f : `'${f}'`))
        .join(' ')}`,
  );
  process.exit(0);
}

console.log(`\n$ bun install ${filters.join(' ')}`);
const proc = Bun.spawn(['bun', 'install', ...filters], {
  cwd: repoRoot,
  stdio: ['inherit', 'inherit', 'inherit'],
});

process.exit(await proc.exited);

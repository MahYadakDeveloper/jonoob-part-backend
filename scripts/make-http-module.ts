#!/usr/bin/env bun
/**
 * @example
 *   Scaffold a feature http module.
 *
 *   bun run scripts/make-http-module.ts <x>                 -> <features>/<x>/http
 *   bun run scripts/make-http-module.ts <x> -g <y>          -> <features>/<y>/<x>/http
 *   bun run scripts/make-http-module.ts <y>/<x>             -> same as above
 *   bun run scripts/make-http-module.ts <a>/<b>/<c>/<x>     -> <features>/<a>/<b>/<c>/<x>/http
 *   bun run scripts/make-http-module.ts <x> -g <a>/<b>/<c>  -> same as above
 *
 *   Package name is @feature/<groups>-<x>-http and the route is <groups>/<x>.
 *   The errors package it depends on is @feature/<x>-errors (made by
 *   make-errors-module.ts).
 *
 *   Options:
 *   -g, --group <y>     optional group path, nesting allowed with "/"
 *   (folders + package prefix + route prefix)
 *   -p, --policy <z>    policy name for x-z.policy.ts (default: management)
 *   --features-dir <p>  features folder relative to repo root (default: feature)
 *   --no-install        skip `bun install --filter`
 *   --dry-run           print what would be written, write nothing
 *   --force             overwrite an existing module folder
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

// ------------------------------------------------------------------ config
const DEFAULT_FEATURES_DIR = 'feature';
const DEFAULT_POLICY = 'management';
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
    policy: { type: 'string', short: 'p' },
    'features-dir': { type: 'string' },
    'no-install': { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
  },
});

const USAGE =
  'Usage: bun run scripts/make-http-module.ts <x> [-g <y>] [-p <z>]';

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
const groups = rawGroups.map((g) => toNames(g));
const groupKebabs = groups.map((g) => g.kebab);
const z = toNames(values.policy ?? DEFAULT_POLICY);

const repoRoot = findRepoRoot(import.meta.dir);
const featuresDir = resolve(
  repoRoot,
  values['features-dir'] ?? DEFAULT_FEATURES_DIR,
);

const fullPath = [...groupKebabs, x.kebab];

const pkgName = `@feature/${fullPath.join('-')}-http`;
const errorsPkgName = `@feature/${x.kebab}-errors`;
const pkgDir = join(featuresDir, ...groupKebabs, x.kebab, 'http');
const route = fullPath.join('/');
const schemaImport = `@infra/schema/${fullPath.join('/')}.schema`;

const tsconfigExtends = relative(
  pkgDir,
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
const Z = z.pascal;
const U = x.kebab.replaceAll('-', '_').toUpperCase();

const abilityFile = `${k}.ability-factory`;
const policyFile = `${k}-${z.kebab}.policy`;
const errorsImport = `${errorsPkgName}/${k}.errors`;

// ---------------------------------------------------------- dto sample
const dtoDoc =
  jsdoc(`Sample DTO for ${k}. Reference only, do not uncomment as is; adapt it to the
real schema.

@example
${FENCE}ts
import { discriminatedVariants } from '@feature/shared/utils/zod';
import {
  ${c}Effect,
  ${c}Reason,
  ${c},
} from '${schemaImport}';
import { createInsertSchema } from 'drizzle-orm/zod';
import { z } from 'zod';

const effect = z.enum(${c}Effect.enumValues);
const reason = z.enum(${c}Reason.enumValues);
const note = z.string().min(1).nullish();

const base = createInsertSchema(${c}).omit({
  id: true,
  createdAt: true,

  managerId: true,

  effect: true,
  reason: true,
  note: true,
});

const { variant, build } = discriminatedVariants(base, 'reason', reason, {
  note,
});

const shortage = { effect: z.literal('shortage') };
const surplus = { effect: z.literal('surplus') };

export const ${c}DtoSchema = build([
  variant('lost', shortage),
  variant('found', surplus),
  variant('other', { effect, note: z.string().min(1) }),
]);

export type ${P}Dto = z.infer<typeof ${c}DtoSchema>;
${FENCE}`);

// ---------------------------------------------------------- command sample
const commandDoc =
  jsdoc(`Sample DB error mapping. Reference only, do not uncomment as is; adapt it to
the real schema and errors. Domain errors come from ${errorsPkgName}
(import from '${errorsImport}'); DbErrors, onFk and onPk come from
'@infra/db-drizzle'.

@example
${FENCE}ts
@DbErrors({
  constraints: {
    // Foreign key violation -> domain error built from the row values
    ...onFk(
      ${c},
      'relatedId',
      ({ relatedId }) => new RelatedNotFoundError(relatedId),
    ),
    // Primary key violation -> domain error
    ...onPk(${c}, ${P}DuplicateError),
    // Check constraint name -> domain error
    [${U}_CHECKS.someRule]: ${P}InvalidStateError,
  },
  // Error kinds (e.g. malformed input) -> domain error
  kinds: { invalidInput: MalformedInputError },
})
${FENCE}`);

// ---------------------------------------------------------- controller sample
const controllerDoc =
  jsdoc(`Sample controller. Reference only, do not uncomment as is; copy what you
need, adapt it, and delete the rest.

Rules this sample follows:
- Thin controller: parse input, call ONE command or query, return its result.
  No business logic and no try/catch; the error filter translates domain errors.
- Auth is explicit on every handler: @RequiredAuth(), @OptionalAuth() or
  @Public(). Never leave a route without one.
- Authorization is the class-level PoliciesGuard + @CheckPolicies below.
- Type @CurrentUser() with UserOf<'role'> when the handler is meant for one
  role, so role-specific fields are available (admin has no id). Use
  AuthenticatedUser only when the handler serves several roles, and narrow on
  user.role before reading role-specific fields. Note that @CurrentUser() does
  not enforce the role: the policy must.
- @ProblemResponses(...) lists the domain errors a handler can produce. It
  documents them in swagger and ties them to the error translation.
  Category errors (NotFound, Conflict, Forbidden, BusinessRuleViolation) are
  mapped to HTTP statuses automatically. An error that extends DomainError
  directly is NOT: it must also be registered in ${U}_ERROR_MAPPINGS
  (${errorsPkgName}), otherwise it surfaces as 500.
- Only list errors the handler really throws, the same ones documented on
  the api contract and the command.
- Input is validated at the boundary: zod schema for @Body and @Query,
  ParseUUIDPipe for ids (use ParseIntPipe if ids are numeric).
- Route order matters: static paths ('featured') before param paths (':id').
- Status codes: POST create 201 (Nest default), PUT/PATCH 200, DELETE 204,
  actions on a resource are POST ':id/<verb>'.
- Never return raw DB rows from a handler; the command or query decides the
  shape of the response.

Sample files this assumes (create them next to this controller): dto files
(create, replace, update, list query), a commands folder and a queries folder.

@example
${FENCE}ts
import {
  type AuthenticatedUser,
  type UserOf,
} from '@feature/authentication-http';
import {
  CurrentUser,
  OptionalAuth,
  Public,
  RequiredAuth,
} from '@feature/authentication-http/decorators';
import { ProblemResponses } from '@feature/error-http/decorators';
import {
  ${P}DuplicateError,
  ${P}InvalidStateError,
  ${P}NotFoundError,
  NotAllowedTo${P}Error,
} from '${errorsImport}';
import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { Archive${P}Command } from './commands/archive-${k}.cmd';
import { Create${P}Command } from './commands/create-${k}.cmd';
import { Delete${P}Command } from './commands/delete-${k}.cmd';
import { Replace${P}Command } from './commands/replace-${k}.cmd';
import { Update${P}Command } from './commands/update-${k}.cmd';
import {
  type Create${P}Dto,
  create${P}DtoSchema,
} from './dto/create-${k}.dto';
import {
  type List${P}QueryDto,
  list${P}QuerySchema,
} from './dto/list-${k}-query.dto';
import {
  type Replace${P}Dto,
  replace${P}DtoSchema,
} from './dto/replace-${k}.dto';
import {
  type Update${P}Dto,
  update${P}DtoSchema,
} from './dto/update-${k}.dto';
import { Get${P}Query } from './queries/get-${k}.query';
import { List${P}Query } from './queries/list-${k}.query';

// constructor: one dependency per use case
constructor(
  private readonly listQuery: List${P}Query,
  private readonly getQuery: Get${P}Query,
  private readonly createCmd: Create${P}Command,
  private readonly replaceCmd: Replace${P}Command,
  private readonly updateCmd: Update${P}Command,
  private readonly deleteCmd: Delete${P}Command,
  private readonly archiveCmd: Archive${P}Command,
) {}

// GET /${route}?page=1  (collection, authenticated)
@RequiredAuth()
@ProblemResponses(NotAllowedTo${P}Error)
@Get()
list(@Query({ schema: list${P}QuerySchema }) q: List${P}QueryDto) {
  return this.listQuery.execute(q);
}

// GET /${route}/featured  (static path, declared BEFORE ':id'; no login needed)
@Public()
@Get('featured')
featured() {
  return this.listQuery.execute({ featured: true });
}

// GET /${route}/:id  (login optional: user is undefined for guests)
@OptionalAuth()
@ProblemResponses(${P}NotFoundError)
@Get(':id')
findOne(
  @Param('id', ParseUUIDPipe) id: string,
  @CurrentUser() user?: AuthenticatedUser,
) {
  return this.getQuery.execute({ id, viewer: user });
}

// GET /${route}/:id/items  (sub-resource: the id comes first, then the name)
@RequiredAuth()
@ProblemResponses(${P}NotFoundError)
@Get(':id/items')
listItems(@Param('id', ParseUUIDPipe) id: string) {
  return this.getQuery.execute({ id, include: 'items' });
}

// POST /${route}  (create, 201)
@RequiredAuth()
@ProblemResponses(${P}DuplicateError, NotAllowedTo${P}Error)
@Post()
create(
  @Body({ schema: create${P}DtoSchema }) dto: Create${P}Dto,
  @CurrentUser() user: UserOf<'manager'>,
) {
  return this.createCmd.execute({ ...dto, managerId: user.id });
}

// PUT /${route}/:id  (full replace: the body is the complete representation)
@RequiredAuth()
@ProblemResponses(${P}NotFoundError, ${P}DuplicateError)
@Put(':id')
replace(
  @Param('id', ParseUUIDPipe) id: string,
  @Body({ schema: replace${P}DtoSchema }) dto: Replace${P}Dto,
  @CurrentUser() user: UserOf<'manager'>,
) {
  return this.replaceCmd.execute({ ...dto, id, managerId: user.id });
}

// PATCH /${route}/:id  (partial update: only the sent fields change)
@RequiredAuth()
@ProblemResponses(${P}NotFoundError, ${P}InvalidStateError)
@Patch(':id')
update(
  @Param('id', ParseUUIDPipe) id: string,
  @Body({ schema: update${P}DtoSchema }) dto: Update${P}Dto,
  @CurrentUser() user: UserOf<'manager'>,
) {
  return this.updateCmd.execute({ ...dto, id, managerId: user.id });
}

// POST /${route}/:id/archive  (state transition as an action, not a PATCH)
@RequiredAuth()
@ProblemResponses(${P}NotFoundError, ${P}InvalidStateError)
@HttpCode(HttpStatus.OK)
@Post(':id/archive')
archive(
  @Param('id', ParseUUIDPipe) id: string,
  @CurrentUser() user: UserOf<'manager'>,
) {
  return this.archiveCmd.execute({ id, managerId: user.id });
}

// DELETE /${route}/:id  (204, empty body)
@RequiredAuth()
@ProblemResponses(${P}NotFoundError, ${P}InvalidStateError)
@HttpCode(HttpStatus.NO_CONTENT)
@Delete(':id')
async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
  await this.deleteCmd.execute({ id });
}
${FENCE}`);

// ---------------------------------------------------------- files
const files: Record<string, string> = {
  // ---------------------------------------------------------- policy
  [`src/policy/${abilityFile}.ts`]: `import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  MongoQuery,
} from '@casl/ability';
import { AuthenticatedUser } from '@feature/authentication-http';
import { AbilityFactory } from '@feature/authorization-http/contracts';

export type ${P}Action = 'manage' | 'read';

// TODO: replace with the real ${P} domain type
export type ${P}SubjectType = Record<string, unknown> & { __typename: '${P}' };

export type ${P}Subject = '${P}' | ${P}SubjectType;

export type ${P}AbilityTuple = [${P}Action, ${P}Subject];

export type ${P}Ability = MongoAbility<${P}AbilityTuple, MongoQuery>;

export class ${P}AbilityFactory implements AbilityFactory<${P}Ability> {
  createFor(user: AuthenticatedUser): ${P}Ability {
    const { can, build } = new AbilityBuilder(
      createMongoAbility<${P}AbilityTuple, MongoQuery>,
    );

    switch (user.role) {
      case 'admin':
      case 'manager':
        can('manage', '${P}');
        break;

      case 'customer':
        // can('read', '${P}', { customerId: user.id });
        break;

      case 'courier':
        break;
    }

    return build({ detectSubjectType: (object) => object.__typename });
  }
}
`,

  [`src/policy/${policyFile}.ts`]: `import {
  PolicyContext,
  PolicyHandler,
} from '@feature/authorization-http/contracts';
import { ${P}Ability } from './${abilityFile}';

export class ${P}${Z}Policy implements PolicyHandler<${P}Ability> {
  async handle(ability: ${P}Ability, _context: PolicyContext): Promise<boolean> {
    return ability.can('manage', '${P}');
  }
}
`,

  // ---------------------------------------------------------- dto (sample in JSDoc)
  [`src/dto/${k}.dto.ts`]: `${dtoDoc}

export {};
`,

  // ---------------------------------------------------------- command
  [`src/commands/${k}.cmd.ts`]: `import { Command } from '@feature/shared/cqrs';
import { type Database, InjectDrizzle } from '@infra/db-drizzle';
import { ${c} } from '${schemaImport}';

import { Injectable } from '@nestjs/common';

type ${P} = typeof ${c}.$inferInsert;

${commandDoc}
@Injectable()
export class ${P}Command implements Command<${P}, void> {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async execute(_input: ${P}): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
`,

  // ---------------------------------------------------------- controller
  [`src/${k}.controller.ts`]: `import { CheckPolicies } from '@feature/authorization-http/decorators';
import { PoliciesGuard } from '@feature/authorization-http/guards';
import { Controller, UseGuards } from '@nestjs/common';

import { ${P}Command } from './commands/${k}.cmd';
import { ${P}AbilityFactory } from './policy/${abilityFile}';
import { ${P}${Z}Policy } from './policy/${policyFile}';

${controllerDoc}
@UseGuards(PoliciesGuard)
@CheckPolicies({
  abilityFactory: ${P}AbilityFactory,
  handlers: [${P}${Z}Policy],
})
@Controller('${route}')
export class ${P}Controller {
  constructor(private readonly ${c}Cmd: ${P}Command) {}
}
`,

  // ---------------------------------------------------------- module
  [`src/${k}.http.module.ts`]: `import { Module } from '@nestjs/common';

import { ${P}Command } from './commands/${k}.cmd';
import { ${P}Controller } from './${k}.controller';

@Module({
  controllers: [${P}Controller],
  providers: [${P}Command],
})
export class ${P}HttpModule {}
`,

  'src/index.ts': `export * from './${k}.http.module';
`,

  // ---------------------------------------------------------- package files
  '.oxlintrc.json': json({
    extends: ['./node_modules/@repo/oxlint-config/http.json'],
  }),

  'tsconfig.json': json({ extends: tsconfigExtends }),

  'package.json': json({
    name: pkgName,
    type: 'commonjs',
    exports: { '.': './src/index.ts' },
    private: true,
    dependencies: {
      '@casl/ability': 'catalog:',
      '@feature/authentication-http': 'workspace:*',
      '@feature/authorization-http': 'workspace:*',
      '@feature/error-http': 'workspace:*',
      '@feature/shared': 'workspace:*',
      [errorsPkgName]: 'workspace:*',
      '@infra/db-drizzle': 'workspace:*',
      '@infra/schema': 'workspace:*',
      '@nestjs/common': 'catalog:',
      '@repo/oxlint-config': 'workspace:*',
      'drizzle-orm': 'catalog:',
      rxjs: 'catalog:',
      zod: 'catalog:',
    },
  }),
};

// ------------------------------------------------------------------ run
const rel = (p: string) => relative(repoRoot, p).replaceAll('\\', '/');

console.log(`package : ${pkgName}`);
console.log(`folder  : ${rel(pkgDir)}`);
console.log(`route   : /${route}`);
console.log(`errors  : ${errorsPkgName} (${errorsImport})`);
console.log(`tsconfig: extends ${tsconfigExtends}`);

if (!existsSync(join(repoRoot, ROOT_TSCONFIG))) {
  console.warn(
    `! ${ROOT_TSCONFIG} not found in repo root; check the "extends" path.`,
  );
}

if (existsSync(pkgDir) && !values.force) {
  console.error(`\n${rel(pkgDir)} already exists. Use --force to overwrite.`);
  process.exit(1);
}

if (values['dry-run']) {
  console.log('\n[dry-run] files:');
  for (const file of Object.keys(files))
    console.log(`  ${rel(join(pkgDir, file))}`);
  process.exit(0);
}

for (const [file, content] of Object.entries(files)) {
  await Bun.write(join(pkgDir, file), content);
  console.log(`+ ${rel(join(pkgDir, file))}`);
}

if (values['no-install']) {
  console.log('\nSkipped install (--no-install).');
  process.exit(0);
}

if (!(await workspaceHasPackage(featuresDir, errorsPkgName))) {
  console.warn(
    `\n! Workspace package ${errorsPkgName} was not found, so install was skipped.` +
      `\n  Create it, then run: bun install --filter '${pkgName}'`,
  );
  process.exit(0);
}

console.log(`\n$ bun install --filter '${pkgName}'`);
const proc = Bun.spawn(['bun', 'install', '--filter', pkgName], {
  cwd: repoRoot,
  stdio: ['inherit', 'inherit', 'inherit'],
});

process.exit(await proc.exited);

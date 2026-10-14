# Project Guide for Coding Agents

## Project and Architecture

Jonoob Part Backend is a TypeScript/pnpm monorepo built primarily with NestJS.
Workspace packages are under `app/`, `feature/`, `infrastructure/`, and
`packages/`; the workspace globs are defined in `pnpm-workspace.yaml`.

- `app/api` is the HTTP composition root. It uses NestJS with Fastify, loads
  feature modules, and configures request parsing, validation, and development
  OpenAPI.
- `app/worker` is a separate NestJS process for background work. Queue
  processors and job handlers belong here; queue infrastructure is shared with
  features through `infrastructure/messaging/queue`.
- `feature/<area>/api` holds feature-facing contracts when that feature has
  this split. `feature/<area>/impl` contains its NestJS implementation,
  controllers, services, repositories, and module. The API package should
  describe the boundary; consumers should depend on that contract rather than
  implementation details. Not every feature has been migrated to this layout.
- Some features, including authentication, currently expose their implementation
  directly as a workspace package and use contracts from `feature/shared`.
- `feature/shared` contains cross-feature types, contracts, guards, decorators,
  policy abstractions, and common domain utilities. Add code here only when it
  is genuinely shared; keep feature-specific behavior with its owning feature.
- `infrastructure/` contains technical adapters and reusable integrations
  (database, Redis, queues/outbox, crypto, storage, rate limiting, and similar
  concerns). Feature packages may depend on these adapters; avoid making
  infrastructure depend on feature implementations.
- `packages/contracts` contains shared package-level contracts. `generated/`
  contains generated output; identify its generator/source before changing it
  by hand.

## Current Migration Status

The architecture is actively changing. The repository owner reports that the
current design has been applied to `feature/shared`, `feature/authentication`,
`app/api`, `app/worker`, `feature/warehouse`, and the infrastructure packages
they require. Other feature areas still need design changes and should not be
assumed to follow the newer structure yet.

Before changing architecture or touching an adjacent feature:

1. Inspect its package manifests, exports, module wiring, and current consumers.
2. Check the current Git working tree and preserve in-progress user changes.
3. Follow the established pattern in the closest migrated feature where it
   fits; do not perform a broad migration unless the task explicitly calls for
   it.
4. Keep public contracts and implementations aligned, update consumers and
   workspace dependencies together, and avoid introducing dependency cycles.
5. Treat this section as a progress note, not a complete migration plan; verify
   the code before relying on it.

## Useful Starting Points

- App composition: `app/api/src/app.module.ts` and `app/worker/src/worker.module.ts`
- Shared auth and policy contracts: `feature/shared/src/contracts/` and
  `feature/shared/src/guards/`
- Authentication implementation: `feature/authentication/impl/src/`
- Warehouse contracts and implementation: `feature/warehouse/api/src/` and
  `feature/warehouse/impl/src/`
- Drizzle/PostgreSQL setup and schema: `infrastructure/database/drizzle/` and
  `drizzle.config.ts`
- Workspace package names, exports, and scripts: each package's `package.json`

Feature modules commonly bind a contract token to an implementation with NestJS
providers and export the token for consumers. For example, inspect the warehouse
API tokens and `WarehouseModule`; authentication currently uses the shared
`AuthenticationApi` contract. Verify the local implementation before reusing
either pattern.

## Working and Validation Conventions

- Use workspace package names and declared package exports for cross-package
  imports. Update the consuming package's `package.json` when adding a workspace
  dependency.
- TypeScript uses strict checking, NodeNext module resolution, and ES2023 as
  configured in `tsconfig.base.json`. Follow the existing two-space,
  single-quoted, semicolon-terminated formatting (`.prettierrc`).
- Read the target package's scripts before choosing a command. Run the
  smallest relevant build or test first; `pnpm -r build` is the whole-workspace
  build.
- Do not assume all features use the same test setup. Some feature test scripts
  run Jest in watch mode; prefer a bounded, non-watch command when validating
  automation.
- Configuration is environment-based. Never add real secrets to source control;
  `.env` files are ignored.
- Preserve existing behavior outside the requested change. Do not replace a
  feature's current design merely to make it look like the newer architecture.

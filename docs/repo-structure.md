# Repository structure

```
school-erp/
  apps/
    api/          NestJS API (pending)
    web/          Web portal (pending)
    mobile/       Expo app (pending)
  packages/
    shared-types/ Roles and types shared by all apps (implemented, tested)
    config/       Shared tsconfig base
  docs/           Technical documentation
  scripts/        Cross-platform Node scripts (no Linux-only shell)
  .github/        CI workflow, PR/issue templates, Dependabot
```

**Why a monorepo:** five developers, shared types between API and clients, one PR can change API and client together, one CI pipeline.

**Why pnpm workspaces (no Turborepo yet):** `pnpm -r` is enough for now. Add Turborepo when build/test time becomes a real problem.

**Mobile caveat:** Expo with pnpm workspaces needs specific configuration. Treat mobile scaffolding as its own spike.

**Repository name:** `school-erp` for now, private repository under the company's GitHub organization. Renaming later is safe (GitHub redirects).

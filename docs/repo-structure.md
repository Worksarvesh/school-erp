# Repository structure

```
school-erp/
  apps/
    api/          NestJS API (modular monolith)
    school-app/   Expo: Principal, VP, Admin, Teacher, Non-teaching (foundation, mock data)
    student-app/  Expo: Student mode + Parent mode (UI, mock data)
    web/          Web portal (pending; framework is an open decision)
  packages/
    shared-types/ Roles and types shared by all apps (implemented, tested)
    api-client/   DTO types and error shape
    mobile-core/  Axios client with refresh, auth store, SecureStorage
    ui/           Theme and shared React Native components
    config/       Shared tsconfig base
  docs/           Technical documentation
  scripts/        Cross-platform Node scripts (no Linux-only shell)
  .github/        CI workflow, PR/issue templates, Dependabot
```

**Why a monorepo:** five developers, shared types between API and clients, one PR can change API and client together, one CI pipeline.

**Why pnpm workspaces (no Turborepo yet):** `pnpm -r` is enough for now. Add Turborepo when build/test time becomes a real problem.

**Mobile caveat:** Expo with pnpm workspaces needs specific configuration. Treat mobile scaffolding as its own spike.

**Repository name:** `school-erp` for now, private repository under the company's GitHub organization. Renaming later is safe (GitHub redirects).

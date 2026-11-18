# school-erp

School ERP platform by Tensei Tech Pvt. Ltd. `school-erp` is a temporary identifier; the product name is not final.

## Status

Monorepo, tooling and CI. `apps/api` (NestJS) is in progress. `apps/student-app` (Expo) has its first UI screens on mock data, see [apps/student-app/README.md](apps/student-app/README.md). `apps/web` and the School Staff app are **not scaffolded yet**.

## Prerequisites (Windows PowerShell)

- Git
- Node.js 24 (see `.node-version`); use `fnm` or `nvm-windows` to switch versions
- Corepack (ships with Node 24) for the pinned pnpm version
- VS Code with the recommended extensions

## Quick start

```powershell
git clone <repository-url> school-erp
cd school-erp
corepack enable
pnpm install
pnpm run check
```

`pnpm run check` runs format check, lint, typecheck, tests and build, the same checks CI runs.

## Scripts

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `pnpm run format`    | Format all files with Prettier                |
| `pnpm run lint`      | ESLint                                        |
| `pnpm run typecheck` | TypeScript check in every workspace           |
| `pnpm run test`      | Tests in every workspace that has them        |
| `pnpm run build`     | Build every workspace that has a build script |
| `pnpm run check`     | All of the above                              |

## Contributing

Short version: branch from `main`, open a PR with a Conventional Commits title, wait for CI, get one review, squash merge. Full guide: [docs/workflow.md](docs/workflow.md).

## Docs

[architecture](docs/architecture.md) · [repository structure](docs/repo-structure.md) · [local setup](docs/local-setup.md) · [workflow](docs/workflow.md) · [CI/CD](docs/ci-cd.md) · [environments](docs/environments.md) · [secrets](docs/secrets.md) · [decisions](docs/decisions.md)

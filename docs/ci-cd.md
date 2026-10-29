# CI/CD

## CI (implemented): `.github/workflows/ci.yml`

Runs on pull requests to `main`, pushes to `main`, and manually.

| Job                        | What it does                                           |
| -------------------------- | ------------------------------------------------------ |
| PR title                   | Conventional Commits check (PRs only)                  |
| Format, lint and typecheck | Prettier check, ESLint, `tsc`                          |
| Unit and integration tests | `pnpm run test` (workspaces that define `test`)        |
| Build                      | `pnpm run build` (workspaces that define `build`)      |
| Dependency audit           | Advisory (non-blocking) `pnpm audit` for high/critical |
| CI passed                  | Aggregate required check for branch protection         |

Design choices: `permissions: contents: read`; frozen lockfile; Node version from `.node-version`; pnpm version pinned through `packageManager`; dependency cache via `setup-node`; no secrets used; superseded runs are cancelled.

Apps without scripts yet (`api`, `web`, `mobile`) are skipped by `--if-present`. This is **pending, not passing**: add scripts when each app is scaffolded and CI starts covering it.

**Verify CI passed:** open the PR (or the Actions tab), confirm every job is green and `CI passed` is present.

**Hardening follow-up:** pin third-party actions to commit SHAs; Dependabot already proposes action updates.

## CD (design only, not implemented)

No target environment or credentials exist yet, so no deploy workflow is committed.

Flow when ready: merge to `main` -> auto-deploy to **staging** -> smoke test (health endpoint) -> manual approval via a GitHub Environment `production` with required reviewers -> deploy to **production** -> health check -> automatic or documented rollback.

Required before enabling:

- Hosting target chosen and approved by the team (cost approval first)
- GitHub Environments `staging` and `production`, secrets stored per environment
- Health endpoint (`/health`) in the API
- Rollback: redeploy the previous image/tag; database migrations must be backward compatible (expand, then contract)
- Backups enabled and a restore test done before production data
- Audit logging and rate limiting in place for the API

Hosting options to compare (no purchase without asking): web portal on Vercel, Netlify, Cloudflare Pages, or S3 + CloudFront; API on a container host (ECS Fargate, Render, Railway, Fly.io); database on Supabase Postgres or AWS RDS; files on S3 or Supabase Storage. Verify current pricing before choosing.

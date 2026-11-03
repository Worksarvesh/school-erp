# Initial technical decisions and open questions

## Decided

| Decision     | Choice                     | Reason                                                                                          |
| ------------ | -------------------------- | ----------------------------------------------------------------------------------------------- |
| Repository   | Monorepo, pnpm workspaces  | Small team, shared types, single CI                                                             |
| Node         | 24 LTS (`.node-version`)   | Current LTS line used by CI                                                                     |
| TypeScript   | 6.0.x                      | typescript-eslint currently supports up to <6.1                                                 |
| Architecture | Modular monolith           | Team size and early stage                                                                       |
| API          | NestJS, REST + OpenAPI     | Structure, guards, validation                                                                   |
| ORM          | Prisma (provisional)       | Productivity for a mixed-experience team; RLS via SQL migrations and per-request tenant context |
| Tests        | Vitest for shared packages | Fast, TS-native                                                                                 |

## Step 1 (tenancy core) decisions, agreed 2026-11-03

| Topic                       | Decision                                                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design status               | System design v1 is treated as approved                                                                                                                                                            |
| Local and CI Postgres       | Docker Compose, PostgreSQL 17                                                                                                                                                                      |
| Primary keys                | UUIDv7 generated in the app (PG 17 has no native `uuidv7()`)                                                                                                                                       |
| ORM                         | Prisma. The RLS spike is the first task of Step 1; fallback is Drizzle if it fails                                                                                                                 |
| Connection strings          | `DATABASE_URL` (app role, no `BYPASSRLS`) and `MIGRATION_DATABASE_URL` (owner role)                                                                                                                |
| Roles per membership        | A user may hold several roles in one school: unique on `(user_id, school_id, role)`                                                                                                                |
| Membership status           | `invited`, `active`, `suspended`, `revoked`                                                                                                                                                        |
| `schools` columns           | `name`, `code` (unique), `udise_code` (nullable), `status`, `shard_key` (smallint, default 0)                                                                                                      |
| `users` in Step 1           | Minimal. Phone, email and password hash arrive in Step 2 as an expand migration                                                                                                                    |
| Permissions                 | `permissions` and `role_permissions` are global (no `school_id`). Keys like `members.read`. Seed only what is in use                                                                               |
| `created_by`                | Nullable (seeded and system rows have no user)                                                                                                                                                     |
| Cross-school memberships    | Second RLS policy on `school_memberships` keyed on `app.user_id`, so login can list a user's schools                                                                                               |
| No tenant context           | Policies use `nullif(current_setting('app.school_id', true), '')::uuid`, so queries return zero rows, not an error                                                                                 |
| RLS on `schools`            | Yes: a tenant sees only its own row. Directory search gets its own path in Step 2                                                                                                                  |
| Test auth in Step 1         | A test-only identity stub. Real JWT arrives in Step 2                                                                                                                                              |
| Cross-school response       | 404 everywhere (do not reveal that the school exists)                                                                                                                                              |
| Deferred                    | Platform-staff path and `outbox_events` to Step 2; full audit to Step 7                                                                                                                            |
| `school_status` (1.3)       | `active`, `suspended` (default `active`). Verification state lives in `school_claims` (Step 2)                                                                                                     |
| RLS on `users` (1.3)        | Visible only as yourself (`app.user_id`) or as a member of the current school. Login lookup by phone/email needs its own path in Step 2                                                            |
| Guard responses (1.4)       | Not an active member: 404. Member without the permission: 403 (they already know the school exists)                                                                                                |
| Identity until Step 2 (1.4) | `IdentityResolver` defaults to "nobody", so every school route returns 401 until JWT auth lands. Tests swap in a header-based stub that lives only in `test/`                                      |
| Tenant transactions (1.4)   | One `withSchoolContext()` transaction per unit of DB work, not one held for the whole request, so connections are not held during non-DB work. The guard's check runs in its own short transaction |
| Default grants (1.5)        | `school.read`: all 10 roles. `members.read`: principal, school_admin, vice_principal. Seeded by migration; change with a new migration                                                             |
| Members list (1.5)          | Cursor pagination ordered by membership id (UUIDv7), `limit` 1-100 (default 50), filters `role` and `status`. Unknown query params return 400                                                      |
| Validation (1.5)            | Global `ValidationPipe` (class-validator) with `whitelist` and `forbidNonWhitelisted`                                                                                                              |
| Audit in Step 1             | Membership and role changes are written to `audit_logs`                                                                                                                                            |
| Observability               | NestJS Observe removed (third-party telemetry not in the design)                                                                                                                                   |
| Linting                     | Root ESLint only; oxlint removed from `apps/api`                                                                                                                                                   |

## Open (decide before scaffolding the relevant app)

1. **Web framework:** Vite SPA vs Next.js. A login-only admin portal fits a SPA; choose Next.js if public pages or SSR are needed.
2. ~~**ORM spike**~~ **Done 2026-11-03: Prisma confirmed.** `apps/api/test/rls-spike.int-spec.ts` shows Prisma 7 (pg adapter, app role) with transaction-local `set_config` gives correct isolation: no rows without context, no leak to the next query on a reused connection or after rollback, cross-school writes blocked, concurrent schools kept apart. Finding: after a transaction-local `set_config` ends, the setting reads as `''` (not NULL) on that connection, so policies must use `nullif(..., '')`.
3. **Hosting and cloud:** Supabase-first vs AWS-from-day-one; run pricing and a small load test first.
4. **Auth:** NestJS-issued JWT sessions vs a managed provider; no OTP on every login, step-up only for sensitive actions.
5. **Expo + pnpm:** monorepo configuration spike for mobile.
6. **DPDP compliance:** consent and retention design reviewed by legal counsel.
7. **Product name:** unverified; trademark and domain checks pending.

## Hardening backlog

SHA-pin GitHub Actions, enable secret scanning, Dependabot reviews, make dependency audit blocking, add CodeQL.

# CLAUDE.md

Rules for every session working in this repo. Source of truth: **System design v1** (`docs/system-design/School_System_design.pdf`, searchable text copy in `docs/system-design/system-design-v1.md`). If code, docs and this file disagree, stop and ask; do not pick one silently.

## Current step

**Build order Step 1: Tenancy core.** Status: questions answered (see "Step 1 decisions" in `docs/decisions.md`). Done: 1.1 local Postgres, 1.2 Prisma + RLS spike (passed, Prisma confirmed), 1.3 tables and RLS migrations, 1.4 tenancy module, 1.5 read endpoints (`GET /v1/schools/:schoolId`, `GET /v1/schools/:schoolId/members`), 1.6 isolation test suite and Postgres in CI. **Step 1 is complete** on branch `feat/tenancy-core` (PR and merge pending). Next: Step 2 (auth and sessions); its open decision is "own auth vs managed provider" (design section 16), so ask before starting.

Step 1 sub-steps: 1.1 local Postgres and DB roles · 1.2 Prisma + RLS spike · 1.3 tables and RLS migrations · 1.4 tenancy module (route prefix, guard, permission decorator, tenant transaction) · 1.5 minimal read endpoints · 1.6 isolation test suite.

Update this marker when a step starts or finishes.

## Tests (apps/api)

- `*.spec.ts`: unit tests (`pnpm --filter api run test`).
- `*.int-spec.ts`: integration tests against the local Docker database, `school_erp_test` only (`pnpm --filter api run test:int`). The test database is migrated automatically first. CI runs them in the `db-test` job against the same Docker Compose database.
- Schema changes: edit `prisma/schema.prisma`, then `pnpm --filter api exec prisma migrate dev --create-only --name <name>`, append any RLS SQL, then `pnpm --filter api run db:migrate` and `pnpm --filter api run db:generate` (Prisma 7 does not regenerate the client on migrate).
- Migrations grant and revoke on the role `school_erp_app` by name; every environment's app role must use that name.

## How we work

- One feature at a time, small PRs, each with tests. Read the relevant design section before starting.
- The developer is on Windows. Every command shown or run is **PowerShell** (no `&&`, no bash syntax).
- Do not assume answers to open decisions (design section 16). Ask.
- Conventional Commits, short-lived branches from `main`, squash merge (see `docs/workflow.md`).

## Architecture (design sections 2, 8)

- **Modular monolith**: one NestJS API plus one worker, same codebase, different entrypoints. No microservices.
- **Modules own their tables.** No module reads or writes another module's tables. Modules: `auth`, `tenancy`, `users`, `students`, `guardians`, `attendance`, `homework`, `notices`, `fees`, `notifications`, `files`, `audit`.
- **Cross-module calls** go through exported service interfaces, or domain events via the **outbox** (`outbox_events` written in the same transaction as the data change, then relayed to the queue). No shared repositories.
- MVP queue: BullMQ on Redis. All jobs are idempotent, with retry and dead-letter handling.

## Multi-tenancy (design section 3), never break these

- Shared database, shared schema. **`school_id` (UUID) on every tenant table.** `schools` has a `shard_key` column from day one.
- **Routes**: every tenant route is `/v1/schools/:schoolId/...`. A guard checks that the caller has an **active membership** in that school and the **required permission**.
- In code: tenant controllers use `@SchoolController('<path>')` (never plain `@Controller`), every route has `@RequirePermission('<key>')` (the guard returns 403 without it), and handlers get the checked school from `@CurrentTenant()`. Permission keys live in `apps/api/src/tenancy/permissions.ts`; the `permissions` / `role_permissions` rows are reference data seeded by migrations (fixed UUIDv7 ids). A new key needs both, and a test checks they agree. Tests never truncate these tables.
- Guard responses: 401 not signed in · 400 school id in body · 404 not an active member (or unknown school) · 403 member without the permission.
- **Never take `school_id` from a request body** (or query). It comes only from the `:schoolId` path param, after the guard has checked it.
- **RLS on every tenant table**: `school_id = current_setting('app.school_id')::uuid`.
- Each request runs in a transaction that sets the tenant with `set_config('app.school_id', <id>, true)` (**transaction-local**). Never use `SET` without `LOCAL` and never set session-level settings, because they leak across pooled connections (PgBouncer transaction mode).
- The app connects as a **non-owner role without `BYPASSRLS`**. Migrations run as a separate owner role.
- Platform staff (verifiers, support) use a separate role and path, and every access is audit-logged.
- All tenant DB work goes through `withSchoolContext()` (or `withUserContext()` for "my own rows") in `apps/api/src/database/school-context.ts`. Do not call `set_config` anywhere else.
- A new table with `school_id` must enable RLS in the same migration (hand-written SQL appended to the Prisma migration). `test/isolation.int-spec.ts` fails if RLS is missing, and also requires fixture rows for every RLS table in that file.
- Policies use the SQL helpers `current_school_id()` and `current_app_user_id()`.
- RLS policies read the setting as `nullif(current_setting('app.school_id', true), '')::uuid`, so a query with no tenant set returns zero rows.
- A cross-school request returns **404** (never reveal that another school exists).
- Cache keys for tenant data always include the school id.
- **Isolation test suite** (`apps/api/test/isolation.int-spec.ts`): two schools; it discovers every served route and every RLS table on its own. Every school route must return 401 signed out, 404 across schools, and work for an all-roles member of its own school. Any route outside `/v1/schools/:schoolId` must be on its `NON_SCHOOL_ROUTES` allowlist, and adding one is a security decision. Never weaken this file to make a new route pass.

## Identity and authorization (design section 4)

- `users` are global (one person, one account). Access comes from `school_memberships(user_id, school_id, role, status)`.
- Roles: principal, school_admin, vice_principal, teacher, non_teaching_staff, office_clerk, accountant, student, parent, other_staff.
- **Guards check permissions, never role names.** Permissions come from a `role -> permission` table (seeded defaults, per-school overrides later).
- Passwords use argon2id. Access JWT lasts 15 min. Refresh tokens rotate and are stored hashed in `sessions`, with reuse detection. OTP only for registration, recovery and step-up.
- Generic error messages (no account enumeration). Rate limits per IP, phone and account.

## Data rules (design sections 6, 12)

- **Primary keys are UUIDv7**, generated in the app (PostgreSQL 17 has no native `uuidv7()`).
- Every tenant table has `school_id`, `created_at`, `updated_at` and `created_by`. Add soft delete (`deleted_at`) only where history matters.
- **Money is integer paise.** Never floats or decimals in JS. Invoices and receipts are immutable once issued; corrections are credit notes or adjustments.
- Student history goes through `enrollments`. Promotion creates a new row and never edits the old one.
- School-specific student fields go in a `custom_fields` JSONB column plus a per-school definition table. No per-school schema changes.
- Collect only what a feature needs. Encrypt sensitive columns.
- **Migrations are expand-then-contract.** Every deploy must be backward compatible and safe to roll back. Never rename or drop a column in the same release that stops using it.

## API rules (design section 7)

- REST, `/v1` prefix, OpenAPI generated from NestJS. DTO validation on every input. One consistent error shape that includes a request id.
- Cursor pagination, plus a whitelist for server-side sorting.
- `Idempotency-Key` header on bulk attendance, payments and any mobile write that may be retried.
- Exports and reports run as async jobs, downloaded through signed URLs. Breaking changes go to `/v2`.

## Security and ops (design sections 9, 11, 12)

- Authorization lives only in the backend. No privileged keys in clients. Secrets go in environment stores, never in git.
- `audit_logs` is append-only and kept separate: logins, role changes, approvals, parent links, exports, fee changes, platform-staff access.
- Structured JSON logs with request id, user id and school id. **No personal data in logs.**
- Files go to object storage under `school_id/...` keys, uploaded through presigned URLs, in private buckets.

## Build order (design section 15)

1. **Tenancy core**: schools, users, memberships, permissions, RLS, isolation test suite. Done.
2. Auth and sessions, OTP, principal registration and verification. <- next
3. School setup: sessions, classes, sections, subjects, staff.
4. Students, enrollments, guardian linking.
5. Attendance, notices, push notifications.
6. Homework and submissions, basic fees records.
7. Hardening: audit, load test, backup restore test, security review.

## Open decisions (design section 16), do not decide alone

DB hosting (Supabase vs RDS) · school directory seed source · auth (own vs managed) · SMS/email provider · payment gateway · DPDP legal review.

# Repo structure: School App, Student App, one backend (2026-11-07)

Status: **proposal, not applied.** No files have been moved. Part of the V1.1 audit (see `AUDIT-2026-11-07.md`, section A9).

## Recommendation

**Option B: one monorepo, one API, one database, two Expo apps, shared packages.** Your starting view holds up. Two changes to the proposal:

1. `packages/shared-types` holds enums, constants and plain types only. The request/response contract comes from the API's OpenAPI document, and `packages/api-client` is **generated** from it. No hand-written zod copies of the API DTOs (the API validates with `class-validator`, see `apps/api/package.json`; two validation systems would drift).
2. Tokens stay as they are: `sub` and `sid` only. The proposal's "token claims (audience, role, school_id)" conflicts with a locked rule (`CLAUDE.md`: "Never put roles or permissions in tokens"; `docs/decisions.md` slice 2A). Role and school are checked live per request, which is why a revoked membership takes effect immediately. See "How data stays centralized" below.

## 1. Current layout vs proposal

| Today                                                | Proposed                                 | What moves                             | What breaks                                                                                                                               |
| ---------------------------------------------------- | ---------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api`                                           | `apps/api`                               | Nothing                                | Nothing                                                                                                                                   |
| `apps/mobile` (README only, `apps/mobile/README.md`) | `apps/school-app` + `apps/student-app`   | Rename the folder; add a second folder | Nothing in code: there is no mobile code. `pnpm-workspace.yaml` uses `apps/*`, so new folders are picked up automatically                 |
| `apps/web` (README only)                             | `apps/web`                               | Nothing                                | Nothing. Framework (Vite vs Next.js) is still an **open decision** (`docs/decisions.md` Open #1); the proposal's "Next.js" is not decided |
| `packages/shared-types` (roles only)                 | same                                     | Nothing                                | Nothing. `roles.ts` changes with the V1.1 role decision (audit Q2)                                                                        |
| —                                                    | `packages/api-client`                    | New                                    | —                                                                                                                                         |
| —                                                    | `packages/ui`                            | New                                    | —                                                                                                                                         |
| `packages/config` (tsconfig base)                    | same, later also shared ESLint/Expo bits | Nothing                                | Nothing                                                                                                                                   |

Docs that name `apps/mobile` and need a text update: `docs/repo-structure.md`, `docs/workflow.md` (team ownership line), `docs/ci-cd.md` (skipped apps), `README.md`, `packages/shared-types/package.json` (`description`). `.gitignore`, `.prettierignore` and `eslint.config.mjs` already ignore `.expo` everywhere, so no change.

## 2. Options compared

| Factor                       | A: one app, role modes                                                                                                          | **B: two apps + shared packages + one API**                                                                                                                    | C: separate repos/backends                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Cost                         | Lowest build count                                                                                                              | Two native builds per release (EAS build minutes double; free-tier limits unverified). One Apple developer account and one Google Play account cover both apps | Highest: two backends, two databases, double hosting                                                                       |
| Team (2 frontend, 2 backend) | Both frontend devs in one app, more merge conflicts                                                                             | One frontend dev per app; shared packages reviewed by both; backend unchanged                                                                                  | Backend team splits or duplicates work                                                                                     |
| Release independence         | None: a teacher fix ships to every parent                                                                                       | Each app ships on its own schedule; API stays backward compatible for both                                                                                     | Full, but at the price of everything below                                                                                 |
| App store listings           | One listing that must describe staff and family use; awkward for "kids/family" store policies                                   | Two clear listings: staff tool vs student/parent app                                                                                                           | Two listings                                                                                                               |
| Bundle size                  | Largest: every role's screens in every install                                                                                  | Each app ships only its screens                                                                                                                                | Same as B                                                                                                                  |
| Security                     | Admin screens and endpoint names ship to students' phones (not data, but more surface to study); backend still the real control | Smaller surface per app; backend is the only control in all options                                                                                            | Data copied between systems; more secrets, more places to leak                                                             |
| Shared code reuse            | Total (one app)                                                                                                                 | High through `packages/*`                                                                                                                                      | Low: copy-paste or published packages                                                                                      |
| Data centralization          | Yes                                                                                                                             | Yes                                                                                                                                                            | **No**: breaks "one source of truth"; a parent with children in two schools, or a teacher who is also a parent, needs sync |
| CI/CD time                   | One app to lint/build                                                                                                           | Lint/typecheck/test both apps in CI (seconds to minutes); native builds outside PR CI                                                                          | Two pipelines                                                                                                              |

**Why B:** the two audiences are different products (staff tool vs family app), they release at different speeds, and store listings and child-focused store rules are simpler apart. B keeps A's data model and almost all of A's code reuse. C breaks the core rule of one database with `school_id` + RLS and is ruled out.

## 3. Folder tree (target)

```
school-erp/
  apps/
    api/            NestJS API (modular monolith) + worker entrypoint (later)
    school-app/     Expo: Principal, VP, Admin, Teaching, Non-Teaching
    student-app/    Expo: Student mode + Parent mode
    web/            Web portal (future; framework open)
  packages/
    shared-types/   Enums, constants, plain types (roles, statuses, permission keys)
    api-client/     Typed client generated from the API's OpenAPI document
    ui/             Design tokens (blue theme) + shared React Native components
    config/         tsconfig base, shared ESLint/Expo config
  docs/
  scripts/
```

Create `api-client` and `ui` when the first screen needs them (during the Expo spike), not as empty folders.

## 4. How data stays centralized

- **One schema, no per-app tables.** Users are global (`users`), access comes from `school_memberships` (staff, students) and, for parents, from verified guardian links (V1.1). No table, column or RLS policy depends on which app is calling.
- **One login API, one token format.** Both apps call `POST /v1/auth/...` and get the same `sub` + `sid` access token (HS256, issuer `school-erp-api`, audience `school-erp`; `apps/api/src/config/app-config.ts`). The app does not change what a user may do; memberships, permissions and guardian links do.
- **Which routes each app uses**

| Caller                    | Routes                                                                                                                    | Guard                                                                                                                                                        | DB context                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| School App (staff roles)  | `/v1/schools/:schoolId/...`                                                                                               | `SchoolAccessGuard`: active membership + `@RequirePermission` (exists today)                                                                                 | `withSchoolContext()`                                                                               |
| Student App, Student mode | `/v1/me` (profile, sessions, my schools) and `/v1/schools/:schoolId/me/...` (my timetable, attendance, homework, results) | Same guard; students are school members with self-only permission keys (e.g. `self.attendance.read`)                                                         | `withSchoolContext()` + `app.user_id`, RLS "own rows" policies                                      |
| Student App, Parent mode  | `GET /v1/me/children` (all linked children, all schools), then `/v1/schools/:schoolId/children/:studentId/...`            | **New guardian check** (recommended): allowed only if the caller has an active guardian link to that student in that school. Unknown school or student = 404 | `withSchoolContext()` + `app.user_id`; RLS on parent-readable tables allows rows of linked students |

- **Parent with children in two schools:** after OTP, the API finds every active guardian link for the verified mobile and returns them from `/v1/me/children` (each with student, school name, logo). The app's child switcher picks one; every later call carries that child's `schoolId` and `studentId` in the path, so each request runs in exactly one school's RLS context. The two schools never meet in one query.
- **Why parent data stays under `/v1/schools/:schoolId`:** it keeps the rule "every tenant route is `/v1/schools/:schoolId/...`" and lets the isolation suite cover parent routes like any other school route. The cost is a second access path in the guard (membership **or** guardian link), which is a security change and needs your approval (open question R1).
- **Optional, not in the token:** record which app opened a session (`sessions.client_app`: `school_app` / `student_app`) for audit and push routing. Never used for authorization.

## 5. Shared vs app-specific

| Shared (one copy)                                                                                                                     | App-specific                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Database and every table: users, schools, memberships, students, guardians, timetable, attendance, notices, notifications, audit logs | Screens and navigation                                                                                                             |
| API, guards, permissions, RLS, audit writes                                                                                           | App config: `app.json` / `app.config.ts`, bundle id, icon, splash, store listing                                                   |
| `shared-types` (roles, statuses, permission keys), generated `api-client`, `ui` tokens and base components                            | Push notification channel names (Android) and which notification types each app shows                                              |
| Auth flow logic (token storage, refresh handling) in `api-client`                                                                     | Login screens: username + password and Principal OTP (School App); student username + password and parent mobile OTP (Student App) |
| One push sender in the API/worker; tokens stored with the app they belong to (`push_tokens.app`)                                      | Firebase/APNs app registration per app (one Firebase project can hold both)                                                        |

## 6. Phase B implications

- Schema and RLS matrix are written per table and per role (school role, student self, parent via link, platform role). **No "per app" rule anywhere.**
- The screen-to-table matrix gets an **API audience** column: `School App`, `Student App - Student`, `Student App - Parent`.
- `push_tokens` carries `app` so a notification for a parent goes to the Student App, not to the same person's School App install.

## 7. Migration steps (after you approve, and after the slice 2A PR is merged)

Run from the repo root in PowerShell, one at a time.

```powershell
git switch main
```

```powershell
git pull
```

```powershell
git switch -c chore/repo-structure
```

```powershell
git mv apps/mobile apps/school-app
```

```powershell
New-Item -ItemType Directory apps/student-app
```

```powershell
Set-Content -Path apps/student-app/README.md -Encoding utf8 -Value "# apps/student-app`n`nReact Native + Expo + TypeScript. Student mode and Parent mode. **Pending: not scaffolded yet.**"
```

Then I update the text in `apps/school-app/README.md`, `docs/repo-structure.md`, `docs/workflow.md`, `docs/ci-cd.md`, `README.md` and `packages/shared-types/package.json`, and you run:

```powershell
pnpm install
```

```powershell
pnpm run check
```

```powershell
git add -A
```

```powershell
git commit -m "chore: split mobile into school-app and student-app"
```

Scaffolding the two Expo apps, `packages/api-client` and `packages/ui` is the Expo + pnpm spike (`docs/decisions.md` Open #5), done as its own PR.

## 8. Risks

| Risk                                                                                     | Mitigation                                                                                                   |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Expo in a pnpm monorepo is not yet proven here, and now twice                            | Do the spike with both apps at once; settle Metro and hoisting config in `packages/config`                   |
| API changes break an old app version still in the field                                  | Expand-then-contract API changes; app-version header (design §7) to force updates; breaking changes to `/v2` |
| Generated client drifts from the API                                                     | Generate in CI from the OpenAPI document and fail on a diff                                                  |
| `packages/ui` grows into a dumping ground                                                | Tokens + a small set of base components only; app screens stay in apps                                       |
| Student App falls under child-directed store policies (Google Play Families, Apple Kids) | Check before the first store submission; no ads or third-party analytics SDKs in the Student App             |
| Double native build cost                                                                 | Use OTA updates for JS-only changes; verify EAS pricing before choosing a plan                               |
| Guardian access path weakens tenant checks                                               | Isolation suite extended: parent routes must 404 for a non-linked student and across schools                 |

## Open questions

| #   | Question                                                                                                                                                                   | Recommended default                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| R1  | Parent data routes: `/v1/schools/:schoolId/children/:studentId/...` with a guardian-link check added to the school guard, or school-less `/v1/me/children/:studentId/...`? | School-scoped path with a guardian check (keeps the tenant-route rule and isolation suite coverage) |
| R2  | Token claims: keep `sub` + `sid` only (current rule), or add audience/role/school claims as proposed?                                                                      | Keep `sub` + `sid`; record the client app on the session row, never authorize by it                 |
| R3  | Contract sharing: generated OpenAPI client, or zod schemas in `shared-types`?                                                                                              | Generated client from OpenAPI; no zod duplicates of API DTOs                                        |

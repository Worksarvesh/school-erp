# School App (V1.2, foundation, mock data)

Expo Router app for school staff: **Principal, Vice Principal, Admin, Teacher, Non-teaching staff**.
It sits next to `apps/student-app` (students and parents) and uses the same API and shared packages
(`docs/system-design/REPO-STRUCTURE.md`, option B).

**Status:** foundation only. Sign-in, role switcher, permission-driven Home and tabs work with
**mock data** (no network). Every module tile opens a "Coming soon" screen until its backend slice
ships.

## Run it (Windows PowerShell, from the repo root)

```powershell
pnpm install
```

```powershell
pnpm --filter school-app start
```

```powershell
pnpm --filter school-app web
```

```powershell
pnpm --filter school-app typecheck
```

Press `a` in the Expo terminal for Android, or scan the QR code with Expo Go.

Expo may rewrite `tsconfig.json` on first start (adds `extends`, changes `include`). Do not commit
that change; keep it identical to `apps/student-app/tsconfig.json`.

### Demo sign-in (mock)

| Path      | Input                                                     | Result                                     |
| --------- | --------------------------------------------------------- | ------------------------------------------ |
| Principal | any valid mobile (10 digits, starts 6-9), any 6-digit OTP | Principal at Green Valley                  |
| Staff     | username `admin`, any password                            | Admin at Green Valley + Teacher at Sunrise |
| Staff     | `vp` / `teacher` / `staff`, any password                  | Vice Principal / Teacher / Non-teaching    |
| Staff     | any username, password starting with `temp`               | Forced "Set a new password" screen first   |

A page reload signs the demo out (mock memberships live in memory only).

## Folder structure

```
apps/school-app/
  app/                         Routes only (Expo Router). One-line files that render a screen.
    _layout.tsx                Providers + route guard
    (auth)/                    splash, role-select, principal-login, otp, staff-login,
                               change-password, forgot-password
    (tabs)/                    index (Home), academics, people, operations, profile
    coming-soon.tsx            Placeholder for modules whose slice is not built
  src/
    core/
      api/school-path.ts       schoolPath(schoolId, path) + API_ROUTES (routes the API serves today)
      navigation/modules.ts    MODULES registry: every module, its permission keys, slice, status
      permissions/             Permission keys, usePermission(), useAnyPermission(), <Can>
    state/session.ts           Memberships, active membership (school + role), login path
    components/                App-wide UI: ModuleGrid, ModuleIcon, RoleSwitcher
    features/<feature>/
      api/<feature>.service.ts Interface + mock implementation (screens never call axios)
      screens/                 Full screens (rendered by app/ routes)
      components/              Pieces used only by this feature
      schemas.ts               zod form schemas (UX validation only)
    mock/                      Mock data. Delete per feature once its API is wired
```

Shared code lives in `packages/` and is **not** copied into the app:

| Package                    | Use it for                                                       |
| -------------------------- | ---------------------------------------------------------------- |
| `@school-erp/ui`           | Theme, `Screen`, `Header`, `Button`, `Input`, `Card`, `Badge`... |
| `@school-erp/mobile-core`  | `apiClient` (token + refresh), `useAuthStore`, `SecureStorage`   |
| `@school-erp/api-client`   | DTO types, `ApiError`                                            |
| `@school-erp/shared-types` | Roles and enums                                                  |

## Rules for every screen (from `CLAUDE.md`)

1. **Permissions, never role names.** Show or hide with `usePermission('key')` or `<Can>`. Never
   write `if (role === 'teacher')`. Role is a label only; a per-member permission grant must work
   with no code change.
2. **The app is UX, the API is security.** Hiding a button is not authorization. The API answers
   403 / 404 on its own; handle both (404 = not a member or wrong school).
3. **School id goes in the path only.** Build tenant URLs with `schoolPath(activeMembership.schoolId, '...')`.
   Never send `schoolId` / `school_id` in a body or query string.
4. **Switching role switches school.** Read `activeMembership` from `useSession`; never cache
   tenant data without the school id in the query key, e.g. `['students', schoolId, filters]`.
5. **No secrets or personal data in logs.** Never `console.log` tokens, passwords, OTP codes or
   phone numbers.
6. **Errors:** the API returns `{ error: { code, message, requestId } }`; `apiClient` turns it into
   `ApiError`. Show `message`, and show `requestId` on "Something went wrong" screens for support.
7. **Generic auth messages** ("Invalid username or password"): never reveal whether an account
   exists.
8. **Out of V1:** fees, documents, discipline, IT staff, teacher chat. Do not build these screens.

## How to add a module (example: Students, slice 4)

1. Set the real permission key in `src/core/permissions/keys.ts` (must match
   `apps/api/src/tenancy/permissions.ts` exactly; move it from PLANNED to LIVE).
2. Add the route to `API_ROUTES` in `src/core/api/school-path.ts` once the API serves it.
3. Create `src/features/students/` with `api/students.service.ts` (interface + mock, then HTTP),
   `screens/StudentListScreen.tsx`, etc. Use TanStack Query with keys that include the school id.
4. Add the route file `app/students/index.tsx` (one line) and register it in `app/_layout.tsx`.
5. In `src/core/navigation/modules.ts` set the module to `status: 'ready'` and `route: '/students'`.
   The tile then appears for every member who holds the key, on Home and in its tab.

## Screen map (`docs/system-design/schema/SCREEN-TRACEABILITY.md`)

| Built now                                                                                                                                                                                      | Next (by backend slice)                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SPLASH, ROLE-SELECTION, PRINCIPAL-MOBILE-LOGIN, PRINCIPAL-OTP, STAFF-LOGIN, CHANGE-TEMP-PASSWORD, FORGOT-PASSWORD, ROLE-SWITCHER, dashboards (one permission-driven Home), SETTINGS (sign out) | 3: academic setup, staff, designations, permission grants, approvals, credentials shown once · 4: students, enrollments, parent link codes · 5: attendance, notices, student messaging, notifications · 6: homework, non-teaching · 7: timetable, substitutions, exams, marks · 8: audit logs, reports |

Not built yet in the auth flow: principal registration, school search, "school not listed" and
verification-pending screens (API exists from slice 2B), and account validation messages.

## Open questions (need a decision before wiring the real API)

| #   | Question                                                                                         | Suggested default                                                                   |
| --- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Q1  | The app needs the caller's permission keys per school. Today `/v1/me` does not return them.      | Add `permissions: string[]` per active membership to `GET /v1/me` (no token change) |
| Q2  | Permission key names for slices 3-8 (placeholders in `keys.ts`).                                 | Backend names them in each slice plan; the app renames to match                     |
| Q3  | Generated API client from OpenAPI (REPO-STRUCTURE R3) vs hand-written DTO types in `api-client`. | Generate from OpenAPI                                                               |
| Q4  | Fonts, icons and brand assets for the School App (Figma "School App" page).                      | Reuse student-app fonts once the design is final                                    |

## Tests

No unit test runner in this app yet (same as student-app). Adding jest + `jest-expo` changes the
root lockfile and needs approval.

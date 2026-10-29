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

## Open (decide before scaffolding the relevant app)

1. **Web framework:** Vite SPA vs Next.js. A login-only admin portal fits a SPA; choose Next.js if public pages or SSR are needed.
2. **ORM spike:** confirm Prisma works cleanly with PostgreSQL RLS (`SET LOCAL` tenant context inside transactions) before committing; fallback is Drizzle.
3. **Hosting and cloud:** Supabase-first vs AWS-from-day-one; run pricing and a small load test first.
4. **Auth:** NestJS-issued JWT sessions vs a managed provider; no OTP on every login, step-up only for sensitive actions.
5. **Expo + pnpm:** monorepo configuration spike for mobile.
6. **DPDP compliance:** consent and retention design reviewed by legal counsel.
7. **Product name:** unverified; trademark and domain checks pending.

## Hardening backlog

SHA-pin GitHub Actions, enable secret scanning, Dependabot reviews, make dependency audit blocking, add CodeQL.

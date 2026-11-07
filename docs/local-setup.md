# Local setup (Windows PowerShell)

1. Install Git and Node.js 24. A version manager helps: `fnm` or `nvm-windows`.
2. Verify:
   ```powershell
   node -v      # v24.x
   git --version
   ```
3. Clone and install:
   ```powershell
   git clone <repository-url> school-erp
   cd school-erp
   corepack enable
   pnpm install
   ```
4. Copy the env template (only when an app needs it):
   ```powershell
   Copy-Item .env.example .env
   ```
   Then fill in your own local values. Never commit `.env`.
5. Start the local database (needs Docker Desktop running). Set the three `DB_*_PASSWORD` values in `.env` first, and use the same passwords in the two database URLs:

   ```powershell
   docker compose up -d --wait
   ```

   PostgreSQL 17 listens on `localhost:5434` with two databases, `school_erp` and `school_erp_test`, and three roles: `school_erp_owner` (migrations), `school_erp_app` (the API; no `BYPASSRLS`) and `school_erp_auth_lookup` (owns the pre-login lookup functions; cannot log in). The roles are created only when the volume is first created. To start over, run `docker compose down -v`, which deletes all local data.

   **Volume created before slice 2A?** It lacks `school_erp_auth_lookup`, so the 2A migration fails. Add the role once:

   ```powershell
   docker compose exec -T postgres psql -U postgres -d postgres -c "CREATE ROLE school_erp_auth_lookup NOLOGIN NOSUPERUSER NOBYPASSRLS; GRANT school_erp_auth_lookup TO school_erp_owner;"
   ```

6. Apply migrations to the dev database:
   ```powershell
   pnpm --filter api exec prisma migrate deploy
   ```
7. Set `JWT_ACCESS_SECRET` and `OTP_HASH_SECRET` (each at least 32 bytes) and `SEED_DEMO_PASSWORD` in `.env` (see `.env.example`; local OTP uses the fixed code `999999`), then load demo schools and users (safe to repeat):
   ```powershell
   pnpm --filter api run seed
   ```
8. Start the API; Swagger UI is at http://localhost:3000/docs. Try the endpoints with `docs/api/*.md`.
   ```powershell
   pnpm --filter api run start:dev
   ```
9. Run the API integration tests (needs the database from step 5):
   ```powershell
   pnpm --filter api run test:int
   ```
10. Run all checks:

```powershell
pnpm run check
```

**If `corepack enable` fails with a permission error:** open PowerShell as Administrator once, or run `npm install -g pnpm@12.16.1` instead.

**Line endings:** the repo enforces LF through `.gitattributes` and `.editorconfig`. Keep VS Code's end-of-line setting on LF.

**Testing conventions:** unit tests live next to the code as `*.test.ts`; tests run with Vitest in shared packages. The API will add integration tests against a real PostgreSQL instance.
